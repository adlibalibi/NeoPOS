import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

firebase_key = os.environ.get('FIREBASE_KEY')
if not firebase_admin._apps:
    cred = credentials.Certificate(json.loads(firebase_key))
    firebase_admin.initialize_app(cred)

db = firestore.client()
