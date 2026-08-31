"""
firebase_admin.py — initialise Firebase Admin SDK once.

Reads credentials from the FIREBASE_SERVICE_ACCOUNT_JSON env var
(a JSON string of the service account key file).

On Render.com: paste the entire service account JSON as an env var.
Locally: set the env var in .env or use GOOGLE_APPLICATION_CREDENTIALS.
"""

import json
import logging
import os

import firebase_admin
from firebase_admin import credentials

logger = logging.getLogger(__name__)
_initialized = False


def init_firebase() -> None:
    global _initialized
    if _initialized or len(firebase_admin._apps) > 0:
        return

    sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    project_id = os.getenv("FIREBASE_PROJECT_ID", "capstone-project-96d2e")

    if sa_json:
        try:
            sa_dict = json.loads(sa_json)
            cred = credentials.Certificate(sa_dict)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialised from FIREBASE_SERVICE_ACCOUNT_JSON.")
            _initialized = True
            return
        except Exception as e:
            logger.error(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    # Fallback: use GOOGLE_APPLICATION_CREDENTIALS file path (local dev)
    gac = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if gac:
        try:
            cred = credentials.Certificate(gac)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialised from GOOGLE_APPLICATION_CREDENTIALS.")
            _initialized = True
            return
        except Exception as e:
            logger.error(f"Failed to load credentials from file: {e}")

    # Last resort: application default credentials (Cloud Run / GCE)
    try:
        firebase_admin.initialize_app(
            options={"projectId": project_id}
        )
        logger.info("Firebase Admin initialised with application default credentials.")
        _initialized = True
    except Exception as e:
        logger.error(f"Firebase Admin initialisation failed entirely: {e}")
        logger.warning("Running without Firebase Auth — set SKIP_AUTH=true for local dev.")
