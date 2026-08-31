"""GET /reports — list saved reports for the authenticated user."""

import logging

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_current_user
from app.models.schemas import ReportsResponse, ReportItem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=ReportsResponse, summary="Get saved reports")
async def get_reports(
    report_id: str = Query(default=None, description="Filter by specific report ID"),
    current_user: dict = Depends(get_current_user),
) -> ReportsResponse:
    """
    Returns report metadata for the authenticated user from Firestore.
    PDF generation and download happen entirely client-side via jsPDF.
    """
    from firebase_admin import firestore

    uid = current_user["uid"]
    db = firestore.client()

    query = db.collection("reports").where("userId", "==", uid).order_by(
        "createdAt", direction=firestore.Query.DESCENDING
    )

    if report_id:
        query = db.collection("reports").where("userId", "==", uid).where(
            "reportId", "==", report_id
        )

    results = []
    for doc in query.stream():
        d = doc.to_dict()
        results.append(
            ReportItem(
                report_id=d.get("reportId", doc.id),
                type=d.get("type", "single"),
                detection_ids=d.get("detectionIds", []),
                created_at=str(d.get("createdAt", "")),
                download_url=d.get("downloadUrl"),
            )
        )

    return ReportsResponse(results=results)
