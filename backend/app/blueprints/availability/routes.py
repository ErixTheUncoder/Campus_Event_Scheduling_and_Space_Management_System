from flask import request, jsonify
from . import availability_bp
from .services import get_all_availability, check_venue_availability_service

@availability_bp.get("/")
def view_available_venues():
    """
    Get all venue availability records.
    """
    response, status = get_all_availability()
    return jsonify(response), status

@availability_bp.post("/check")
def check_availability():
    """
    Check if a venue is available for a specific date/time.
    Body: { venue_id, date, start_time, end_time }
    """
    data = request.get_json(silent=True) or {}
    response, status = check_venue_availability_service(data)
    return jsonify(response), status

@availability_bp.post("/")
def set_venue_availability():
    """
    Admin: Set venue availability (stub).
    Body example:
    {
      "venue_id": 1,
      "date": "2026-01-10",
      "start": "09:00",
      "end": "18:00",
      "is_available": true
    }
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "set venue availability (stub)", "received": data}), 201
