from ...models.user import User, UserRole
from ...models.event_request import EventRequest, EventRequestStatus
from ...models.venue_request import VenueRequest, VenueRequestStatus
from ...models.booking_request import BookingRequest, BookingStatus
from ...models.venue import Venue
from ...models.venue_availability import VenueAvailability


def _require_user(user_id: int):
    if not user_id:
        return None, ({"error": "user_id is required"}, 400)

    user = User.query.get(user_id)
    if not user:
        return None, ({"error": "User not found"}, 404)

    return user, None


def _event_to_calendar_item(e: EventRequest):
    """
    Build calendar item for an APPROVED event request
    Include all APPROVED venue requests for this event
    """
    venue_reqs = VenueRequest.query.filter(
        VenueRequest.event_id == e.event_id,
        VenueRequest.status == VenueRequestStatus.APPROVED
    ).all()

    venue_names = []

    for vr in venue_reqs:
        # ✅ VenueRequest has NO venue_id
        # Use venue_available_id -> VenueAvailability -> Venue
        va = VenueAvailability.query.get(vr.venue_available_id) if vr.venue_available_id else None
        if not va:
            continue

        venue = Venue.query.get(va.venue_id) if va.venue_id else None
        if venue:
            venue_names.append(venue.venue_name)

    return {
        "id": f"event-{e.event_id}",
        "type": "EVENT",
        "title": e.event_name,
        "date": e.event_date.isoformat() if e.event_date else None,
        "start_time": e.start_time.strftime("%H:%M") if e.start_time else None,
        "end_time": e.end_time.strftime("%H:%M") if e.end_time else None,
        "venues": venue_names,
        "owner_id": e.user_id,
        "status": e.status.value if e.status else None,
    }


def _booking_to_calendar_item(b: BookingRequest):
    """
    Build calendar item for an APPROVED booking request
    Uses VenueAvailability.start_datetime/end_datetime (based on your create_venue_request code)
    """
    va = VenueAvailability.query.get(b.venue_available_id) if b.venue_available_id else None
    venue = Venue.query.get(va.venue_id) if va and va.venue_id else None

    venue_name = venue.venue_name if venue else "Unknown Venue"

    # ✅ Your VenueAvailability is created with start_datetime/end_datetime
    start_dt = va.start_datetime if va else None
    end_dt = va.end_datetime if va else None

    date_iso = start_dt.date().isoformat() if start_dt else (b.booking_date.isoformat() if b.booking_date else None)
    start_time = start_dt.strftime("%H:%M") if start_dt else None
    end_time = end_dt.strftime("%H:%M") if end_dt else None

    return {
        "id": f"booking-{b.booking_id}",
        "type": "BOOKING",
        "title": f"Booking - {venue_name}",
        "date": date_iso,
        "start_time": start_time,
        "end_time": end_time,
        "venues": [venue_name],
        "owner_id": b.user_id,
        "status": b.status.value if b.status else None,
    }


def get_calendar(user_id: int):
    user, err = _require_user(user_id)
    if err:
        return err

    calendar = []

    # ADMIN: see ALL approved events + bookings
    if user.user_role == UserRole.ADMIN:
        events = EventRequest.query.filter(
            EventRequest.status == EventRequestStatus.APPROVED
        ).all()
        for e in events:
            calendar.append(_event_to_calendar_item(e))

        bookings = BookingRequest.query.filter(
            BookingRequest.status == BookingStatus.APPROVED
        ).all()
        for b in bookings:
            calendar.append(_booking_to_calendar_item(b))

        return {"calendar": calendar}, 200

    # EVENT ORGANIZER: see ONLY their own approved events
    if user.user_role == UserRole.EVENT_ORGANIZER:
        events = EventRequest.query.filter(
            EventRequest.status == EventRequestStatus.APPROVED,
            EventRequest.user_id == user.user_id
        ).all()

        for e in events:
            calendar.append(_event_to_calendar_item(e))

        return {"calendar": calendar}, 200

    # STUDENT: see ONLY their own approved bookings
    if user.user_role == UserRole.STUDENT:
        bookings = BookingRequest.query.filter(
            BookingRequest.status == BookingStatus.APPROVED,
            BookingRequest.user_id == user.user_id
        ).all()

        for b in bookings:
            calendar.append(_booking_to_calendar_item(b))

        return {"calendar": calendar}, 200

    return {"error": "Forbidden"}, 403
