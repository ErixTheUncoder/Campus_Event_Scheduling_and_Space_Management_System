from ...extensions import db
from ...models.venue_availability import VenueAvailability


def get_all_availability():
    """
    Get all venue availability records.
    """
    try:
        availability_records = VenueAvailability.query.all()
        return {
            "availability": [record.to_dict() for record in availability_records]
        }, 200
    except Exception as e:
        return {"error": str(e)}, 500
