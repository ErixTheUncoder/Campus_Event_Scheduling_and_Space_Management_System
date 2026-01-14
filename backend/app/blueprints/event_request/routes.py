from flask import request, jsonify
from . import event_requests_bp
from .services import (
    create_event_request,
    list_event_requests,
    get_event_request,
    decide_event_request,
    delete_event_request
)


@event_requests_bp.post("/")
def submit_request():
    data = request.get_json(silent=True) or {}
    resp, code = create_event_request(data)
    return jsonify(resp), code


@event_requests_bp.get("/")
def list_requests():
    # /api/event-requests/?viewer_id=3&status=PENDING
    viewer_id = request.args.get("viewer_id", type=int)
    status = request.args.get("status")

    resp, code = list_event_requests(viewer_id=viewer_id, status=status)
    return jsonify(resp), code



@event_requests_bp.get("/<int:event_id>")
def get_request(event_id):
    viewer_id = request.args.get("viewer_id", type=int)
    resp, code = get_event_request(event_id, viewer_id)
    return jsonify(resp), code


@event_requests_bp.patch("/<int:event_id>/decision")
def decide_request(event_id):
    data = request.get_json(silent=True) or {}
    resp, code = decide_event_request(event_id, data)
    return jsonify(resp), code


@event_requests_bp.delete("/<int:event_id>")
def remove_request(event_id):
    data = request.get_json(silent=True) or {}
    resp, code = delete_event_request(event_id, data)
    return jsonify(resp), code
