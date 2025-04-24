from flask import Blueprint, request, jsonify
from firebase_admin import firestore

billing_bp = Blueprint("billing", __name__)
db = firestore.client()

@billing_bp.route("/create", methods=["POST"])
def create_bill():
    data = request.json
    items = data["items"] 
    user_id = data["user_id"]
    total = 0
    bill_items = []

    for item in items:
        product_id = item["id"]
        qty = item["qty"]

        doc_ref = db.collection("users").document(user_id).collection("inventory").document(product_id)
        product_doc = doc_ref.get()

        if not product_doc.exists:
            return jsonify({"error": f"Product {product_id} not found"}), 404

        product = product_doc.to_dict()

        if product["stock"] < qty:
            return jsonify({"error": f"Insufficient stock for {product['name']}"}), 400

        cost = qty * product["price"]
        total += cost

        bill_items.append({
            "name": product["name"],
            "qty": qty,
            "price": product["price"],
            "subtotal": cost
        })
        doc_ref.update({"stock": product["stock"] - qty})

    bill = {
        "items": bill_items,
        "total": total
    }

    return jsonify({"message": "Bill created", "bill": bill})