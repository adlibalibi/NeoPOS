from flask import Flask
from inventory import inventory_bp
from billing import billing_bp
from payment2 import payment_bp

app = Flask(__name__)
app.register_blueprint(inventory_bp, url_prefix="/inventory")
app.register_blueprint(billing_bp, url_prefix="/billing")
app.register_blueprint(payment_bp, url_prefix="/payment")

if __name__ == "__main__":
    app.run(debug=True)
