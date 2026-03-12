import stripe
from flask import Blueprint, request, jsonify
import traceback
import os
from firebase_admin import firestore, auth
import json

from firebase_config import db
payment_bp = Blueprint("payment", __name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

def _get_bearer_token():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return header.split("Bearer ", 1)[1].strip()

def _require_uid():
    token = _get_bearer_token()
    if not token:
        return None, (jsonify({"error": "Missing Authorization bearer token"}), 401)
    try:
        decoded = auth.verify_id_token(token)
        uid = decoded.get("uid")
        if not uid:
            return None, (jsonify({"error": "Invalid token"}), 401)
        return uid, None
    except Exception:
        return None, (jsonify({"error": "Invalid token"}), 401)

def _require_staff(uid):
    user_doc = db.collection("users").document(uid).get()
    role = (user_doc.to_dict() or {}).get("role")
    if role not in ("admin", "staff"):
        return (jsonify({"error": "Forbidden"}), 403)
    return None

@payment_bp.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        uid, err = _require_uid()
        if err:
            return err
        forbidden = _require_staff(uid)
        if forbidden:
            return forbidden

        data = request.get_json()
        user_id = uid
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
        uid, err = _require_uid()
        if err:
            return err

        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != 'paid':
            return jsonify({"error": "Payment not completed"}), 400

        metadata = session.metadata
        user_id = metadata.get('user_id')
        raw_items = metadata.get('items')
        items = []

        if not user_id:
            return jsonify({"error": "Missing metadata"}), 400

        if user_id != uid:
            return jsonify({"error": "Forbidden"}), 403

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
        uid, err = _require_uid()
        if err:
            return err
        forbidden = _require_staff(uid)
        if forbidden:
            return forbidden

        data = request.get_json()
        user_id = uid
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

@payment_bp.route("/webhook", methods=["POST"])
def stripe_webhook():
    if not STRIPE_WEBHOOK_SECRET:
        return jsonify({"error": "Stripe webhook not configured"}), 500
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get("Stripe-Signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        return jsonify({"error": "Invalid webhook"}), 400

    # Scaffold: prefer handling checkout.session.completed here for durability.
    # Current flow still verifies via /payment/session/<id> on the success page.
    if event.get("type") == "checkout.session.completed":
        session = event["data"]["object"]
        # Intentionally no side-effects yet; to be filled once webhook is enabled in Stripe dashboard.
        return jsonify({"received": True})

    return jsonify({"received": True})
