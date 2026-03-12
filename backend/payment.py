import stripe
from flask import Blueprint, request, jsonify
import traceback
import os
from firebase_admin import firestore
import json

from firebase_config import db
payment_bp = Blueprint("payment", __name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")

@payment_bp.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        items = data.get("items")

        # Backward-compat: allow single-item payload
        if not items:
            item_id = data.get("item_id")
            quantity = int(data.get("quantity", 1))
            if item_id:
                items = [{"item_id": item_id, "quantity": quantity}]

        if not user_id or not items or not isinstance(items, list):
            return jsonify({"error": "Missing user_id or items"}), 400

        line_items = []
        canonical_items = []

        for entry in items:
            item_id = entry.get("item_id") if isinstance(entry, dict) else None
            quantity = int(entry.get("quantity", 1)) if isinstance(entry, dict) else 1
            if not item_id:
                return jsonify({"error": "Missing item_id in items"}), 400
            if quantity <= 0:
                return jsonify({"error": "Quantity must be positive"}), 400

            item_ref = db.collection("users").document(user_id).collection("inventory").document(item_id)
            item_doc = item_ref.get()

            if not item_doc.exists:
                return jsonify({"error": f"Item not found: {item_id}"}), 404

            item_data = item_doc.to_dict()
            price = float(item_data["price"])
            stock = int(item_data["stock"])
            name = item_data["name"]

            if quantity > stock:
                return jsonify({"error": f"Quantity exceeds available stock for item: {name}"}), 400

            canonical_items.append({"item_id": item_id, "quantity": quantity})
            line_items.append({
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": name},
                    "unit_amount": int(price * 100),
                },
                "quantity": quantity,
            })

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{FRONTEND_BASE_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_BASE_URL}/failed",
            metadata={
                "user_id": user_id,
                "items": json.dumps(canonical_items),
            }
        )

        return jsonify({"url": checkout_session.url})
    except Exception as e:
        print("Checkout error:", e)
        return jsonify({"error": str(e)}), 500
@payment_bp.route("/session/<session_id>", methods=["GET"])
def get_session(session_id):
    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != 'paid':
            return jsonify({"error": "Payment not completed"}), 400

        metadata = session.metadata
        user_id = metadata.get('user_id')
        raw_items = metadata.get('items')
        items = []

        if not user_id:
            return jsonify({"error": "Missing metadata"}), 400

        existing = db.collection("users").document(user_id).collection("transactions").where("stripeSessionId", "==", session_id).limit(1).get()
        if existing:
            return jsonify({"message": "Already processed", "transactionId": existing[0].id})

        if raw_items:
            try:
                items = json.loads(raw_items)
            except Exception:
                return jsonify({"error": "Invalid items metadata"}), 400
        else:
            # Backward-compat for older sessions
            item_id = metadata.get('item_id')
            quantity = int(metadata.get('quantity', 1))
            if item_id:
                items = [{"item_id": item_id, "quantity": quantity}]

        if not items:
            return jsonify({"error": "Missing metadata"}), 400

        tx_items = []
        for entry in items:
            item_id = entry.get('item_id')
            quantity = int(entry.get('quantity', 1))
            if not item_id:
                return jsonify({"error": "Missing item_id in metadata items"}), 400
            if quantity <= 0:
                return jsonify({"error": "Quantity must be positive"}), 400

            item_ref = db.collection("users").document(user_id).collection("inventory").document(item_id)
            item_doc = item_ref.get()

            if not item_doc.exists:
                return jsonify({"error": f"Item not found: {item_id}"}), 404

            item_data = item_doc.to_dict()
            current_stock = int(item_data.get("stock", 0))

            if current_stock < quantity:
                return jsonify({"error": f"Insufficient stock for item: {item_data.get('name')}"}), 400

            item_ref.update({
                "stock": current_stock - quantity
            })

            unit_price = float(item_data.get("price", 0))
            tx_items.append({
                "itemId": item_id,
                "name": item_data.get("name"),
                "quantity": quantity,
                "unitPrice": unit_price,
                "lineTotal": unit_price * quantity,
            })

        transaction_ref = db.collection("users").document(user_id).collection("transactions").document()
        transaction_ref.set({
            "provider": "stripe",
            "stripeSessionId": session_id,
            "paymentStatus": session.payment_status,
            "currency": session.currency,
            "amountSubtotal": session.amount_subtotal,
            "amountTotal": session.amount_total,
            "items": tx_items,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })

        return jsonify({"message": "Stock updated successfully", "transactionId": transaction_ref.id})
    except Exception as e:
        print("Session retrieval error:", e)
        return jsonify({"error": str(e)}), 500

@payment_bp.route("/record-sale", methods=["POST"])
def record_sale():
    try:
        data = request.get_json()
        user_id = data.get("user_id")
        items = data.get("items")
        payment_method = data.get("payment_method", "cash")

        if not user_id or not items or not isinstance(items, list):
            return jsonify({"error": "Missing user_id or items"}), 400

        tx_items = []
        total = 0.0

        for entry in items:
            item_id = entry.get("item_id") if isinstance(entry, dict) else None
            quantity = int(entry.get("quantity", 1)) if isinstance(entry, dict) else 1
            if not item_id:
                return jsonify({"error": "Missing item_id in items"}), 400
            if quantity <= 0:
                return jsonify({"error": "Quantity must be positive"}), 400

            item_ref = db.collection("users").document(user_id).collection("inventory").document(item_id)
            item_doc = item_ref.get()
            if not item_doc.exists:
                return jsonify({"error": f"Item not found: {item_id}"}), 404

            item_data = item_doc.to_dict()
            current_stock = int(item_data.get("stock", 0))
            if current_stock < quantity:
                return jsonify({"error": f"Insufficient stock for item: {item_data.get('name')}"}), 400

            item_ref.update({
                "stock": current_stock - quantity
            })

            unit_price = float(item_data.get("price", 0))
            line_total = unit_price * quantity
            total += line_total
            tx_items.append({
                "itemId": item_id,
                "name": item_data.get("name"),
                "quantity": quantity,
                "unitPrice": unit_price,
                "lineTotal": line_total,
            })

        transaction_ref = db.collection("users").document(user_id).collection("transactions").document()
        transaction_ref.set({
            "provider": "manual",
            "paymentMethod": payment_method,
            "paymentStatus": "paid",
            "currency": "inr",
            "amountTotal": int(round(total * 100)),
            "items": tx_items,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })

        return jsonify({"message": "Sale recorded", "transactionId": transaction_ref.id})
    except Exception as e:
        print("Record sale error:", e)
        return jsonify({"error": str(e)}), 500
