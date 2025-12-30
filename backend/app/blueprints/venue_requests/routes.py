from flask import request, jsonify
from . import venue_requests_bp

@venue_requests_bp.post("/")
def create_venue_request():
    """
    Event Organiser: Submit venue request (stub).
    Body example:
    {
      "organiser_id": 5,
      "venue_id": 2,
      "date": "2026-01-10",
      "start": "10:00",
      "end": "12:00",
      "reason": "Event"
    }
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "create venue request (stub)", "received": data}), 201

@venue_requests_bp.get("/")
def list_venue_requests():
    """
    Admin/Organiser: List venue requests (stub).
    Example: /api/venue-requests?status=PENDING&organiser_id=5
    """
    params = {
        "status": request.args.get("status"),
        "organiser_id": request.args.get("organiser_id", type=int),
        "page": request.args.get("page", default=1, type=int),
        "page_size": request.args.get("page_size", default=20, type=int),
    }
    return jsonify({"message": "list venue requests (stub)", "params": params}), 200

@venue_requests_bp.patch("/<int:request_id>/decision")
def decide_venue_request(request_id: int):
    """
    Admin: Approve/Reject venue request (stub).
    Body example: {"decision":"APPROVED","admin_id":1,"remark":"OK"}
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "venue request decision (stub)", "request_id": request_id, "received": data}), 200
