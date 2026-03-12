import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

if not firebase_admin._apps:
    if os.environ.get("FIRESTORE_EMULATOR_HOST"):
        # For emulators we avoid requiring application default credentials.
        firebase_admin.initialize_app(options={"projectId": os.environ.get("GCLOUD_PROJECT", "demo-no-project")})
    else:
        firebase_key = os.environ.get('FIREBASE_KEY')
        cred = credentials.Certificate(json.loads(firebase_key))
        firebase_admin.initialize_app(cred)

if os.environ.get("FIRESTORE_EMULATOR_HOST"):
    from google.cloud import firestore as gcfirestore
    from google.auth.credentials import AnonymousCredentials

    db = gcfirestore.Client(
        project=os.environ.get("GCLOUD_PROJECT", "demo-no-project"),
        credentials=AnonymousCredentials(),
    )
else:
    db = firestore.client()
