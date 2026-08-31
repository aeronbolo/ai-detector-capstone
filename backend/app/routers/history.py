"""GET /history — paginated detection history for the authenticated user."""

import logging

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.models.schemas import HistoryResponse, HistoryItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryResponse, summary="Get detection history")
async def get_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: dict = Depends(get_current_user),
) -> HistoryResponse:
    """
    Returns a paginated list of the authenticated user's past detections.

    History is read directly from Firestore on the frontend via the Firebase SDK
    for real-time updates. This endpoint is provided for server-side access
    (e.g. PDF report generation, admin queries).
    """
    from firebase_admin import firestore

    uid = current_user["uid"]
    db = firestore.client()

    query = (
        db.collection("detections")
        .where("userId", "==", uid)
        .where("deleted", "==", False)
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
    )

    all_docs = query.stream()
    docs = list(all_docs)
    total = len(docs)

    page = docs[offset: offset + limit]
    results = []
    for doc in page:
        d = doc.to_dict()
        results.append(
            HistoryItem(
                detection_id=d.get("detectionId", doc.id),
                file_name=d.get("fileName", ""),
                file_type=d.get("fileType", "image"),
                label=d.get("label", "Real"),
                confidence=float(d.get("confidence", 0)),
                created_at=str(d.get("createdAt", "")),
            )
        )

    return HistoryResponse(total=total, results=results)
