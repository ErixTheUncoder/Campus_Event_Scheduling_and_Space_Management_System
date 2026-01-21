from flask import request,jsonify
from . import venues_bp
from .services import list_venues, get_venue


@venues_bp.get("/")
def get_venues():
    filters = {
        "venue_type": request.args.get("venue_type"),
        "location": request.args.get("location"),
        "min_capacity": request.args.get("min_capacity", type=int),
    }

    response, status = list_venues(filters)
    return jsonify(response), status


@venues_bp.get("/<int:venue_id>")
def get_venue_details(venue_id: int):
    """
    Get venue details by ID (real data).
    """
    response, status = get_venue(venue_id)
    return jsonify(response), status
