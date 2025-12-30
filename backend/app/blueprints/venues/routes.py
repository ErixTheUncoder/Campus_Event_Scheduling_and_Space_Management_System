from flask import request, jsonify
from . import venues_bp

@venues_bp.get("/")
def search_venues():
    """
    Search venues (stub).
    Example: /api/venues?name=Lab&location=BlockA&min_capacity=30
    """
    filters = {
        "name": request.args.get("name"),
        "location": request.args.get("location"),
        "min_capacity": request.args.get("min_capacity", type=int),
        "type": request.args.get("type"),
    }
    return jsonify({"message": "search venues (stub)", "filters": filters}), 200

@venues_bp.get("/<int:venue_id>")
def get_venue_details(venue_id: int):
    """
    View venue details (stub).
    """
    return jsonify({"message": "get venue details (stub)", "venue_id": venue_id}), 200
