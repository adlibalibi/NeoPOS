import stripe
from flask import Blueprint, request, jsonify
import traceback
import os

payment_bp = Blueprint("payment", __name__)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@payment_bp.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    try:
        data = request.get_json()
        print("Received data:", data)
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": data.get("product_name", "Sample Product"),
                        },
                        "unit_amount": int(data.get("amount", 1000)),
                    },
                    "quantity": data.get("quantity", 1),
                }
            ],
            mode="payment",
            success_url="http://localhost:3000/success",
            cancel_url="http://localhost:3000/cancel",
        )
        return jsonify({"id": session.id, "url": session.url})
    except Exception as e:
        print("Full error:")
        traceback.print_exc()
        return jsonify(error=str(e)), 400

'''@payment_bp.route("/create-checkout-session", methods=["POST"])
def test_session():
    data = request.get_json()
    print("Test endpoint hit. Data:", data)
    return jsonify({"message": "It works!", "data": data})'''


