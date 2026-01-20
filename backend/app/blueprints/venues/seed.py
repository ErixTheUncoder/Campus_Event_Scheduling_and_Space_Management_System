from ...extensions import db
from ...models.venue import Venue, VenueType

def seed_venues():
    venues = []

    # --------------------
    # Lecture Halls (CLC)
    # --------------------
    for i in range(1001, 1006):
        venues.append(Venue(
            venue_name=f"CNMX{i}",
            location="Central Lecture Complex (CLC)",
            capacity=120,
            venue_type=VenueType.LECTURE_HALL
        ))

    venues.append(Venue(
        venue_name="CQMX1001",
        location="Central Lecture Complex (CLC)",
        capacity=150,
        venue_type=VenueType.LECTURE_HALL
    ))

    # --------------------
    # Tutorial Rooms (FCI)
    # --------------------
    for block in ["CQAR", "CQCR"]:
        for floor in range(1, 5):
            for room in range(1, 5):
                venues.append(Venue(
                    venue_name=f"{block}{floor}00{room}",
                    location="Faculty of Computing & Informatics (FCI)",
                    capacity=40,
                    venue_type=VenueType.TUTORIAL_ROOM
                ))

    # --------------------
    # Computer Labs (FCI)
    # --------------------
    for block in ["CQAR"]:
        for floor in range(1, 4):
            for room in range(5, 8):
                venues.append(Venue(
                    venue_name=f"{block}{floor}00{room}",
                    location="Faculty of Computing & Informatics (FCI)",
                    capacity=40,
                    venue_type=VenueType.COMPUTER_LAB
                ))

    # --------------------
    # Auditoriums
    # --------------------
    venues.extend([
        Venue(
            venue_name="Dewan Tun Canselor (DTC)",
            location="DTC",
            capacity=3000,
            venue_type=VenueType.AUDITORIUM
        ),
        Venue(
            venue_name="FOM Auditorium",
            location="Faculty of Management (FOM)",
            capacity=200,
            venue_type=VenueType.AUDITORIUM
        ),
        Venue(
            venue_name="E-Theatre",
            location="Faculty of Creative Multimedia (FCM)",
            capacity=300,
            venue_type=VenueType.AUDITORIUM
        )
    ])

    # --------------------
    # Multipurpose Hall
    # --------------------
    venues.append(Venue(
        venue_name="Multipurpose Hall",
        location="MPH",
        capacity=200,
        venue_type=VenueType.MULTIPURPOSE_HALL
    ))

    # --------------------
    # Meeting Rooms
    # --------------------
    venues.extend([
        Venue(
            venue_name="Learning Point Idea Box 1",
            location="Siti Hasmah Digital Library",
            capacity=10,
            venue_type=VenueType.MEETING_ROOM
        ),
        Venue(
            venue_name="Learning Point Idea Box 2",
            location="Siti Hasmah Digital Library",
            capacity=10,
            venue_type=VenueType.MEETING_ROOM
        )
    ])

    # --------------------
    # Sports Arenas
    # --------------------
    sports = [
        "Netball Court",
        "Rugby Field",
        "Tennis Court",
        "Volleyball Court",
        "Indoor Sports Centre",
        "Gym",
        "Squash Court",
        "Stadium MMU",
        "Swimming Pool"
    ]

    for s in sports:
        venues.append(Venue(
            venue_name=s,
            location="Sports Complex",
            capacity=0,  # capacity varies / not applicable
            venue_type=VenueType.SPORTS_ARENA
        ))

    # --------------------
    # Insert only if NOT exists
    # --------------------
    for v in venues:
        exists = Venue.query.filter_by(
            venue_name=v.venue_name,
            venue_type=v.venue_type
        ).first()

        if not exists:
            db.session.add(v)

    db.session.commit()
    print("✅ Venue seeding completed.")
