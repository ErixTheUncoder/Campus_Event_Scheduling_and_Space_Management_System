from flask import request, jsonify
from . import availability_bp
from .service import get_all_availability

@availability_bp.get("/")
def view_available_venues():
    """
    Get all venue availability records.
    """
    response, status = get_all_availability()
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
