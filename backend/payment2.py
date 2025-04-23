from flask import Blueprint, request, jsonify

payment_bp = Blueprint('payment', __name__)

@payment_bp.route('/payment/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.get_json()
    print("Incoming data:", data)  # Log the request data

    # Simple validation
    if not data or 'product_name' not in data or 'amount' not in data or 'quantity' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    # Simulate a successful session creation
    fake_session_id = "dummy_session_123456"
    return jsonify({'id': fake_session_id}), 200
