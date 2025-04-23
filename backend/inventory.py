from flask import Blueprint, request, jsonify

inventory_bp = Blueprint("inventory", __name__)
inventory = {}  # {product_id: {"name": ..., "price": ..., "stock": ...}}

@inventory_bp.route("/add", methods=["POST"])
def add_item():
    data = request.json
    product_id = data["id"]
    inventory[product_id] = {
        "name": data["name"],
        "price": data["price"],
        "stock": data["stock"]
    }
    return jsonify({"message": "Item added", "inventory": inventory})

@inventory_bp.route("/update/<product_id>", methods=["PUT"])
def update_item(product_id):
    if product_id not in inventory:
        return jsonify({"error": "Item not found"}), 404
    data = request.json
    inventory[product_id].update(data)
    return jsonify({"message": "Item updated", "item": inventory[product_id]})

@inventory_bp.route("/delete/<product_id>", methods=["DELETE"])
def delete_item(product_id):
    if product_id in inventory:
        del inventory[product_id]
        return jsonify({"message": "Item deleted"})
    return jsonify({"error": "Item not found"}), 404

@inventory_bp.route("/all", methods=["GET"])
def get_all_items():
    return jsonify(inventory)
