import json
from ...extensions import db
from ...models.venue import Venue, VenueType
from ...models.user import User, UserRole
from ..audit.services import log_action


def _require_admin(admin_id: int):
    admin = User.query.get(admin_id)
    if not admin:
        return None, ({"error": "Admin user not found"}, 404)
    if admin.user_role != UserRole.ADMIN:
        return None, ({"error": "Forbidden: Admin only"}, 403)
    return admin, None


def create_venue(payload: dict):
    try:
        admin_id = int(payload.get("admin_id"))
    except (TypeError, ValueError):
        return {"error": "admin_id is required"}, 400

    admin, err = _require_admin(admin_id)
    if err:
        return err

    venue_name = (payload.get("venue_name") or "").strip()
    location = (payload.get("location") or "").strip()
    capacity = payload.get("capacity")
    venue_type = (payload.get("venue_type") or "").strip()

    if not venue_name or not location or capacity is None or not venue_type:
        return {"error": "venue_name, location, capacity, venue_type are required"}, 400

    try:
        capacity = int(capacity)
        if capacity <= 0:
            raise ValueError
    except ValueError:
        return {"error": "capacity must be a positive integer"}, 400

    # venue_type expects enum NAME like: "LECTURE_HALL"
    vt_key = venue_type.strip().upper()
    try:
        vt_enum = VenueType[vt_key]
    except KeyError:
        return {"error": "Invalid venue_type", "allowed": [v.name for v in VenueType]}, 400

    v = Venue(
        venue_name=venue_name,
        location=location,
        capacity=capacity,
        venue_type=vt_enum
    )

    db.session.add(v)
    db.session.flush()

    log_action(
        user_id=admin.user_id,
        action_type="VENUE_CREATED",
        entity_type="Venue",
        entity_id=v.venue_id,
        new_value=json.dumps(v.to_dict())
    )

    db.session.commit()
    return {"message": "Venue created", "venue": v.to_dict()}, 201


def list_venues():
    venues = Venue.query.order_by(Venue.venue_id.asc()).all()
    return {"venues": [v.to_dict() for v in venues]}, 200


def get_venue(venue_id: int):
    v = Venue.query.get(venue_id)
    if not v:
        return {"error": "Venue not found"}, 404
    return {"venue": v.to_dict()}, 200
