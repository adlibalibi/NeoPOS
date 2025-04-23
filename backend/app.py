from flask import Flask
from inventory import inventory_bp
from billing import billing_bp
from payment import payment_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(inventory_bp, url_prefix="/inventory")
app.register_blueprint(billing_bp, url_prefix="/billing")
app.register_blueprint(payment_bp, url_prefix="/payment")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
