from flask import request, jsonify
from . import availability_bp

@availability_bp.get("/")
def view_available_venues():
    """
    Student/Admin: View available venues by date/time range (stub).
    Example: /api/availability?date=2026-01-10&start=10:00&end=12:00&capacity=50
    """
    params = {
        "date": request.args.get("date"),
        "start": request.args.get("start"),
        "end": request.args.get("end"),
        "capacity": request.args.get("capacity", type=int),
        "location": request.args.get("location"),
    }
    return jsonify({"message": "view available venues (stub)", "params": params}), 200

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
