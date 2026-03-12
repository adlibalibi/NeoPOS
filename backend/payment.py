import stripe
from flask import Blueprint, request, jsonify
import traceback
import os
from firebase_admin import firestore

from firebase_config import db
payment_bp = Blueprint("payment", __name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@payment_bp.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        data = request.get_json()
        item_id = data.get("item_id")
        user_id = data.get("user_id")
        quantity = int(data.get("quantity", 1))

        if not item_id or not user_id:
            return jsonify({"error": "Missing item_id or user_id"}), 400

        item_ref = db.collection("users").document(user_id).collection("inventory").document(item_id)
        item_doc = item_ref.get()

        if not item_doc.exists:
            return jsonify({"error": "Item not found"}), 404

        item_data = item_doc.to_dict()
        price = float(item_data["price"])
        stock = int(item_data["stock"])
        name = item_data["name"]

        if quantity > stock:
            return jsonify({"error": "Quantity exceeds available stock"}), 400

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": name},
                    "unit_amount": int(price * 100),
                },
                "quantity": quantity,
            }],
            mode="payment",
            success_url="https://neopos.netlify.app/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://neopos.netlify.app/failed",
            metadata={
                "item_id": item_id,
                "user_id": user_id,
                "quantity": str(quantity),
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
        item_id = metadata.get('item_id')
        user_id = metadata.get('user_id')
        quantity = int(metadata.get('quantity', 1))

        if not item_id or not user_id:
            return jsonify({"error": "Missing metadata"}), 400

        item_ref = db.collection("users").document(user_id).collection("inventory").document(item_id)
        item_doc = item_ref.get()

        if not item_doc.exists:
            return jsonify({"error": "Item not found"}), 404

        item_data = item_doc.to_dict()
        current_stock = int(item_data.get("stock", 0))

        if current_stock < quantity:
            return jsonify({"error": "Insufficient stock"}), 400

        # Update the stock
        item_ref.update({
            "stock": current_stock - quantity
        })

        transaction_ref = db.collection("users").document(user_id).collection("transactions").document()
        unit_price = float(item_data.get("price", 0))
        transaction_ref.set({
            "provider": "stripe",
            "stripeSessionId": session_id,
            "paymentStatus": session.payment_status,
            "currency": session.currency,
            "amountSubtotal": session.amount_subtotal,
            "amountTotal": session.amount_total,
            "items": [{
                "itemId": item_id,
                "name": item_data.get("name"),
                "quantity": quantity,
                "unitPrice": unit_price,
                "lineTotal": unit_price * quantity,
            }],
            "createdAt": firestore.SERVER_TIMESTAMP,
        })

        return jsonify({"message": "Stock updated successfully", "transactionId": transaction_ref.id})
    except Exception as e:
        print("Session retrieval error:", e)
        return jsonify({"error": str(e)}), 500
