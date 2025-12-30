from flask import request, jsonify
from . import events_bp

@events_bp.post("/")
def create_event():
    """
    Event Organiser: Manage event (create) (stub).
    Body example: {"title":"Seminar","organiser_id":5,"date":"2026-01-10"}
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "create event (stub)", "received": data}), 201

@events_bp.patch("/<int:event_id>")
def update_event(event_id: int):
    """
    Event Organiser: Manage event (update) (stub).
    """
    data = request.get_json(silent=True) or {}
    return jsonify({"message": "update event (stub)", "event_id": event_id, "received": data}), 200

@events_bp.get("/<int:event_id>")
def view_event_details(event_id: int):
    """
    Admin/Event Organiser: View event details (stub).
    """
    return jsonify({"message": "view event details (stub)", "event_id": event_id}), 200

@events_bp.get("/schedules")
def view_event_schedules():
    """
    Event Organiser: Handle event schedules (stub).
    Example: /api/events/schedules?date=2026-01-10&organiser_id=5
    """
    params = {
        "date": request.args.get("date"),
        "organiser_id": request.args.get("organiser_id", type=int),
    }
    return jsonify({"message": "view event schedules (stub)", "params": params}), 200
