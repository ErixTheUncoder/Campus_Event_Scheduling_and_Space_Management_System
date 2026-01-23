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
    # Approved Venues linked to this event
    venues = VenueRequest.query.filter(
        VenueRequest.event_id == e.event_id,
        VenueRequest.status == VenueRequestStatus.APPROVED
    ).all()

    venue_names = []
    for v in venues:
        venue = Venue.query.get(v.venue_id)
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
        "owner_id": e.user_id,  # creator (Event Organizer/Admin)
    }


def _booking_to_calendar_item(b: BookingRequest):
    va = VenueAvailability.query.get(b.venue_available_id) if b.venue_available_id else None
    venue = Venue.query.get(va.venue_id) if va else None

    venue_name = venue.venue_name if venue else "Unknown Venue"
    start_time = va.start_time.strftime("%H:%M") if va and va.start_time else None
    end_time = va.end_time.strftime("%H:%M") if va and va.end_time else None

    return {
        "id": f"booking-{b.booking_id}",
        "type": "BOOKING",
        "title": f"Booking - {venue_name}",
        "date": b.booking_date.isoformat() if b.booking_date else None,
        "start_time": start_time,
        "end_time": end_time,
        "venues": [venue_name],
        "owner_id": b.user_id,  # creator (Student/Admin)
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
