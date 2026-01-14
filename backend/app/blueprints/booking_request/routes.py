from flask import request, jsonify
from . import booking_requests_bp
from .services import (
    create_booking_request,
    list_booking_requests,
    get_booking_request,
    decide_booking_request,
    cancel_booking_request
)


@booking_requests_bp.post("/")
def submit_booking():
    data = request.get_json(silent=True) or {}
    resp, code = create_booking_request(data)
    return jsonify(resp), code


@booking_requests_bp.get("/")
def list_bookings():
    # /api/booking-requests/?viewer_id=2&status=PENDING
    viewer_id = request.args.get("viewer_id", type=int)
    status = request.args.get("status")
    resp, code = list_booking_requests(viewer_id=viewer_id, status=status)
    return jsonify(resp), code


@booking_requests_bp.get("/<int:booking_id>")
def get_booking(booking_id):
    viewer_id = request.args.get("viewer_id", type=int)
    resp, code = get_booking_request(booking_id, viewer_id)
    return jsonify(resp), code


@booking_requests_bp.patch("/<int:booking_id>/decision")
def decide_booking(booking_id):
    data = request.get_json(silent=True) or {}
    resp, code = decide_booking_request(booking_id, data)
    return jsonify(resp), code


@booking_requests_bp.delete("/<int:booking_id>")
def remove_booking(booking_id):
    data = request.get_json(silent=True) or {}
    resp, code = cancel_booking_request(booking_id, data)
    return jsonify(resp), code
