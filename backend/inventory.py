from flask import Blueprint, request, jsonify
from firebase_config import db

inventory_bp = Blueprint("inventory", __name__)

@inventory_bp.route("/add", methods=["POST"])
def add_item():
    data = request.json
    user_id = data.get("user_id")
    product_id = data.get("id")

    if not user_id or not product_id:
        return jsonify({"error": "user_id and product_id required"}), 400

    try:
        item_data = {
            "user_id": user_id, 
            "name": data.get("name"),
            "price": data.get("price"),
            "stock": data.get("stock")
        }
        doc_ref = db.collection("inventories").document(product_id)
        doc_ref.set(item_data)

        return jsonify({"message": "Item added successfully", "item": item_data})
    except Exception as e:
        print(f"Error adding item: {str(e)}")
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/update/<product_id>", methods=["PUT"])
def update_item(product_id):
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        doc_ref = db.collection("inventories").document(product_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify({"error": "Item not found"}), 404
        item_data = doc.to_dict()
        if item_data.get("user_id") != user_id:
            return jsonify({"error": "Not authorized to update this item"}), 403
        update_data = {}
        if "name" in data:
            update_data["name"] = data.get("name")
        if "price" in data:
            update_data["price"] = data.get("price")
        if "stock" in data:
            update_data["stock"] = data.get("stock")

        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        return jsonify({"message": "Item updated", "item": updated_doc.to_dict()})
    except Exception as e:
        print(f"Error updating item: {str(e)}")
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/delete/<product_id>", methods=["DELETE"])
def delete_item(product_id):
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        doc_ref = db.collection("inventories").document(product_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify({"error": "Item not found"}), 404
        item_data = doc.to_dict()
        if item_data.get("user_id") != user_id:
            return jsonify({"error": "Not authorized to delete this item"}), 403

        doc_ref.delete()
        return jsonify({"message": "Item deleted successfully"})
    except Exception as e:
        print(f"Error deleting item: {str(e)}")
        return jsonify({"error": str(e)}), 500

@inventory_bp.route("/all", methods=["GET"])
def get_all_items():
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    try:
        inventory_ref = db.collection("inventories").where("user_id", "==", user_id)
        docs = inventory_ref.stream()

        inventory = {}
        for doc in docs:
            inventory[doc.id] = doc.to_dict()

        return jsonify(inventory)
    except Exception as e:
        print(f"Error fetching inventory: {str(e)}")
        return jsonify({"error": str(e)}), 500