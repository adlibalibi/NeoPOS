from flask import Blueprint, request, jsonify
# from firebase_admin import firestore  # Commented out Firebase import

users_bp = Blueprint("users", __name__)
# db = firestore.client()  # Commented out Firebase client initialization

@users_bp.route("/create", methods=["POST"])
def create_user():
    data = request.get_json()
    
    # user_ref = db.collection("users").document()  # Commented out database reference
    # user_ref.set({
    #     "name": data["name"],
    #     "email": data["email"],
    #     "password": data["password"],
    #     "createdAt": firestore.SERVER_TIMESTAMP
    # })  # Commented out setting user data in Firestore
    
    return jsonify({"status": "success", "user_id": "fake_user_id"})  # Modify return for testing without Firebase
