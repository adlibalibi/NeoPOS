from flask import Blueprint, request, jsonify
from inventory import inventory

billing_bp = Blueprint("billing", __name__)
bills = []  # Stores all bill records

@billing_bp.route("/create", methods=["POST"])
def create_bill():
    items = request.json["items"]  # list of {"id": ..., "qty": ...}
    total = 0
    bill_items = []

    for item in items:
        product_id = item["id"]
        qty = item["qty"]

        if product_id not in inventory:
            return jsonify({"error": f"Product {product_id} not found"}), 404

        product = inventory[product_id]

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

        inventory[product_id]["stock"] -= qty

    bill = {
        "items": bill_items,
        "total": total
    }
    bills.append(bill)
    return jsonify({"message": "Bill created", "bill": bill})
