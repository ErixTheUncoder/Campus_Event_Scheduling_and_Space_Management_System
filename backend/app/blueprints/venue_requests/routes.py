from flask import request, jsonify
from . import venue_requests_bp
from .services import (
    create_venue_request as create_venue_request_service,
    list_venue_requests as list_venue_requests_service,
    decide_venue_request as decide_venue_request_service
)


@venue_requests_bp.post("/")
def create_venue_request():
    """
    Event Organizer: Submit venue request
    """
    payload = request.get_json(silent=True) or {}
    response, status = create_venue_request_service(payload)
    return jsonify(response), status


@venue_requests_bp.get("/")
def list_venue_requests():
    """
    Admin / Event Organizer: List venue requests
    """
    viewer_id = request.args.get("viewer_id", type=int)

    filters = {
        "status": request.args.get("status"),
        "event_id": request.args.get("event_id", type=int),
    }

    response, status = list_venue_requests_service(viewer_id, filters)
    return jsonify(response), status


@venue_requests_bp.patch("/<int:request_id>/decision")
def decide_venue_request(request_id: int):
    """
    Admin: Approve / Reject venue request
    """
    payload = request.get_json(silent=True) or {}
    response, status = decide_venue_request_service(request_id, payload)
    return jsonify(response), status
