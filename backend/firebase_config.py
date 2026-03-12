import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

if not firebase_admin._apps:
    if os.environ.get("FIRESTORE_EMULATOR_HOST"):
        firebase_admin.initialize_app(options={"projectId": os.environ.get("GCLOUD_PROJECT", "demo-no-project")})
    else:
        firebase_key = os.environ.get('FIREBASE_KEY')
        cred = credentials.Certificate(json.loads(firebase_key))
        firebase_admin.initialize_app(cred)

db = firestore.client()
