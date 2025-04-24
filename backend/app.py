from flask import Flask
from inventory import inventory_bp
from billing import billing_bp
from users import users_bp
from payment import payment_bp
from flask_cors import CORS
import firebase_admin
import os
from firebase_admin import credentials, firestore

cred_path = os.path.join(os.path.dirname(__file__), 'fb_key.json')

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(inventory_bp, url_prefix="/inventory")
app.register_blueprint(billing_bp, url_prefix="/billing")
app.register_blueprint(payment_bp, url_prefix="/payment")
app.register_blueprint(users_bp, url_prefix="/users")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
