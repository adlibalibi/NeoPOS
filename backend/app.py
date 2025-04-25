from flask import Flask, Response, request
from payment import payment_bp
from flask_cors import CORS
import os

from prometheus_client import Counter, generate_latest, CONTENT_TYPE_LATEST

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.register_blueprint(payment_bp, url_prefix="/payment")

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])

@app.before_request
def before_request_func():
    REQUEST_COUNT.labels(method=request.method, endpoint=request.path).inc()

@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    app.run(host="0.0.0.0", port=port, debug=True)
