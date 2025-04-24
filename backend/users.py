from flask import Blueprint, request, jsonify
from firebase_admin import firestore

users_bp = Blueprint("users", __name__)
db = firestore.client()

@users_bp.route("/create", methods=["POST"])
def create_user():
    data = request.get_json()
    user_ref = db.collection("users").document()
    user_ref.set({
        "name": data["name"],
        "email": data["email"],
        "password": data["password"],
        "createdAt": firestore.SERVER_TIMESTAMP
    })
    return jsonify({"status": "success", "user_id": user_ref.id})
