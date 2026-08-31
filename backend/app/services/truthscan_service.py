"""
truthscan_service.py — TruthScan API integration.

Primary detection engine for both images and videos.
Provides: detection result, confidence, real heatmap URL, analysis details.

Image flow (3-step):
  1. GET  /get-presigned-url  → presigned_url + file_path
  2. PUT  presigned_url       → upload image bytes
  3. POST /detect             → submit for analysis → poll /query until done

Video flow (2-step):
  1. POST /detect-file        → submit video → get job id
  2. POST /query              → poll until status == "done"

Polling:
  - Max 60 seconds for images, 180 seconds for videos
  - 2-second interval between polls
"""

import asyncio
import logging
import mimetypes
import os
import re

import httpx

logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
_API_KEY        = os.getenv("TRUTHSCAN_API_KEY", "")
_IMAGE_BASE     = "https://detect-image.truthscan.com"
_VIDEO_BASE     = "https://detect-video.truthscan.com"
_POLL_INTERVAL  = 2          # seconds between /query calls
_IMAGE_TIMEOUT  = 60         # max seconds to wait for image result
_VIDEO_TIMEOUT  = 180        # max seconds to wait for video result


def truthscan_available() -> bool:
    return bool(_API_KEY)


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE DETECTION
# ─────────────────────────────────────────────────────────────────────────────

async def detect_image_truthscan(
    image_bytes: bytes,
    filename: str,
) -> dict | None:
    """
    Run TruthScan image detection.

    Returns:
    {
        "label":             "AI-Generated" | "Real" | "Digitally Edited" | "AI Edited",
        "confidence":        float (0–100),
        "model":             "truthscan",
        "heatmap_url":       str | None,
        "analysis_details":  dict | None,
        "warnings":          list,
        "raw":               dict   ← full /query response
    }
    or None on failure (caller falls back to local model).
    """
    if not truthscan_available():
        return None

    # Sanitise filename — remove spaces, keep extension
    safe_name = re.sub(r"\s+", "_", filename)
    content_type = _mime(safe_name)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:

            # ── Step 1: Get pre-signed upload URL ─────────────────────────────
            r1 = await client.get(
                f"{_IMAGE_BASE}/get-presigned-url",
                params={"file_name": safe_name},
                headers={"apikey": _API_KEY},
            )
            if r1.status_code != 200:
                logger.error(f"TruthScan presign failed {r1.status_code}: {r1.text}")
                return None

            presign_data  = r1.json()
            presigned_url = presign_data["presigned_url"]
            file_path     = presign_data["file_path"]

            # ── Step 2: Upload image to storage ───────────────────────────────
            r2 = await client.put(
                presigned_url,
                content=image_bytes,
                headers={
                    "Content-Type": content_type,
                    "x-amz-acl": "private",
                },
            )
            if r2.status_code not in (200, 201, 204):
                logger.error(f"TruthScan PUT failed {r2.status_code}")
                return None

            # ── Step 3: Submit for detection ──────────────────────────────────
            storage_host = "https://ai-image-detector-prod.nyc3.digitaloceanspaces.com"
            file_url     = f"{storage_host}/{file_path}"

            r3 = await client.post(
                f"{_IMAGE_BASE}/detect",
                json={
                    "key":                      _API_KEY,
                    "url":                      file_url,
                    "generate_heatmap":         True,
                    "generate_heatmap_overlayed": True,
                    "generate_preview":         False,
                    "generate_analysis_details": True,
                    "model":                    "generic",
                },
            )
            if r3.status_code not in (200, 201, 202):
                logger.error(f"TruthScan /detect failed {r3.status_code}: {r3.text}")
                return None

            job_id = r3.json()["id"]
            logger.info(f"TruthScan image job submitted: {job_id}")

        # ── Poll until done ───────────────────────────────────────────────────
        result = await _poll_image(job_id, _IMAGE_TIMEOUT)
        return result

    except Exception as e:
        logger.error(f"TruthScan image detection failed: {e}")
        return None


async def _poll_image(job_id: str, timeout: int) -> dict | None:
    """Poll /query until status == done, then normalise the result."""
    elapsed = 0
    async with httpx.AsyncClient(timeout=30.0) as client:
        while elapsed < timeout:
            await asyncio.sleep(_POLL_INTERVAL)
            elapsed += _POLL_INTERVAL

            r = await client.post(
                f"{_IMAGE_BASE}/query",
                json={"id": job_id},
            )
            if r.status_code != 200:
                logger.warning(f"TruthScan poll {r.status_code}: {r.text}")
                continue

            data   = r.json()
            status = data.get("status")
            logger.info(f"TruthScan image poll [{elapsed}s]: status={status}")

            if status == "failed":
                logger.error(f"TruthScan job {job_id} failed.")
                return None

            if status != "done":
                # Still pending/analyzing — keep polling
                continue

            # ── Parse result ──────────────────────────────────────────────────
            details    = data.get("result_details", {})
            final_res  = details.get("final_result", "")
            confidence = float(details.get("final_label_confidence") or details.get("confidence") or 0)
            label      = _normalise_image_label(final_res)

            # Heatmap URL — may still be pending; poll once more if needed
            heatmap_url = None
            if details.get("heatmap_status") == "ready":
                heatmap_url = details.get("heatmap_url")
            elif details.get("heatmap_status") == "pending":
                heatmap_url = await _wait_for_heatmap(job_id, client)

            # Analysis details — may also be async
            analysis = details.get("analysis_results")
            if not analysis and details.get("analysis_results_status") in ("pending", "analyzing"):
                analysis = await _wait_for_analysis(job_id, client)

            return {
                "label":            label,
                "confidence":       round(confidence, 1),
                "model":            "truthscan",
                "heatmap_url":      heatmap_url,
                "analysis_details": analysis,
                "warnings":         details.get("warnings", []),
                "raw":              data,
            }

    logger.error(f"TruthScan image job {job_id} timed out after {timeout}s")
    return None


async def _wait_for_heatmap(job_id: str, client: httpx.AsyncClient, max_wait: int = 30) -> str | None:
    """Poll a few more times for heatmap after main result is ready."""
    for _ in range(max_wait // _POLL_INTERVAL):
        await asyncio.sleep(_POLL_INTERVAL)
        r = await client.post(f"{_IMAGE_BASE}/query", json={"id": job_id})
        if r.status_code == 200:
            details = r.json().get("result_details", {})
            if details.get("heatmap_status") == "ready":
                return details.get("heatmap_url")
    return None


async def _wait_for_analysis(job_id: str, client: httpx.AsyncClient, max_wait: int = 30) -> dict | None:
    """Poll a few more times for analysis_results after main result is ready."""
    for _ in range(max_wait // _POLL_INTERVAL):
        await asyncio.sleep(_POLL_INTERVAL)
        r = await client.post(f"{_IMAGE_BASE}/query", json={"id": job_id})
        if r.status_code == 200:
            details = r.json().get("result_details", {})
            status  = details.get("analysis_results_status")
            if status in ("ready", "done"):
                return details.get("analysis_results")
            if status in ("skipped", "failed"):
                return None
    return None


# ─────────────────────────────────────────────────────────────────────────────
# VIDEO DETECTION
# ─────────────────────────────────────────────────────────────────────────────

async def detect_video_truthscan(
    video_bytes: bytes,
    filename: str,
    use_faceswap: bool = False,
) -> dict | None:
    """
    Run TruthScan video detection.

    Returns:
    {
        "label":       "AI-Generated" | "Real",
        "confidence":  float (0–100),
        "model":       "truthscan-video",
        "raw":         dict
    }
    or None on failure.
    """
    if not truthscan_available():
        return None

    model = "faceswap" if use_faceswap else "generic"

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Single-step multipart upload
            r = await client.post(
                f"{_VIDEO_BASE}/detect-file",
                headers={"key": _API_KEY},
                files={"file": (filename, video_bytes, _mime(filename))},
                data={"model": model},
            )
            if r.status_code not in (200, 201, 202):
                logger.error(f"TruthScan video submit failed {r.status_code}: {r.text}")
                return None

            job_id = r.json()["id"]
            logger.info(f"TruthScan video job submitted: {job_id}")

        result = await _poll_video(job_id, _VIDEO_TIMEOUT)
        return result

    except Exception as e:
        logger.error(f"TruthScan video detection failed: {e}")
        return None


async def _poll_video(job_id: str, timeout: int) -> dict | None:
    elapsed = 0
    async with httpx.AsyncClient(timeout=30.0) as client:
        while elapsed < timeout:
            await asyncio.sleep(_POLL_INTERVAL)
            elapsed += _POLL_INTERVAL

            r = await client.post(
                f"{_VIDEO_BASE}/query",
                json={"id": job_id},
            )
            if r.status_code != 200:
                continue

            data   = r.json()
            status = data.get("status")
            logger.info(f"TruthScan video poll [{elapsed}s]: status={status}")

            if status == "failed":
                return None

            if status != "done":
                continue

            # result is a scalar 0.0–1.0 (prob_fake)
            prob_fake  = float(data.get("result", 0.5))
            label      = "AI-Generated" if prob_fake >= 0.5 else "Real"
            confidence = round((prob_fake if prob_fake >= 0.5 else 1 - prob_fake) * 100, 1)

            return {
                "label":      label,
                "confidence": confidence,
                "model":      "truthscan-video",
                "raw":        data,
            }

    logger.error(f"TruthScan video job {job_id} timed out after {timeout}s")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _mime(filename: str) -> str:
    """Return MIME type for a filename. Defaults to application/octet-stream."""
    mime, _ = mimetypes.guess_type(filename)
    return mime or "application/octet-stream"


def _normalise_image_label(raw: str) -> str:
    """Map TruthScan final_result to our standard labels."""
    r = (raw or "").lower()
    if "ai" in r and ("generated" in r or "edited" in r):
        return "AI-Generated"
    if "digital" in r and "edited" in r:
        return "Digitally Edited"
    if "real" in r:
        return "Real"
    return raw or "Unknown"
