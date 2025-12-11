"""
Seed script to populate database with mock bus data.
Run with: python -m app.seed_data
"""

from datetime import date, time, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models.bus import Operator, City, Route, Bus, BusSchedule, Seat, BoardingPoint, DroppingPoint


def create_operators(db: Session):
    """Create bus operators."""
    operators = [
        {"name": "VRL Travels", "code": "VRL", "rating": 4.5, "logo_url": None},
        {"name": "SRS Travels", "code": "SRS", "rating": 4.3, "logo_url": None},
        {"name": "KSRTC", "code": "KSRTC", "rating": 4.0, "logo_url": None},
        {"name": "Orange Travels", "code": "ORANGE", "rating": 4.2, "logo_url": None},
        {"name": "Sugama Travels", "code": "SUGAMA", "rating": 4.4, "logo_url": None},
        {"name": "Neeta Travels", "code": "NEETA", "rating": 4.1, "logo_url": None},
        {"name": "Paulo Travels", "code": "PAULO", "rating": 4.6, "logo_url": None},
        {"name": "Greenline Travels", "code": "GREEN", "rating": 4.2, "logo_url": None},
        {"name": "Sharma Transports", "code": "SHARMA", "rating": 3.9, "logo_url": None},
        {"name": "IntrCity SmartBus", "code": "INTRCITY", "rating": 4.7, "logo_url": None},
    ]
    
    created = []
    for op_data in operators:
        operator = Operator(**op_data, total_buses=5)
        db.add(operator)
        created.append(operator)
    db.commit()
    print(f"✅ Created {len(created)} operators")
    return created


def create_cities(db: Session):
    """Create cities."""
    cities = [
        {"name": "Bengaluru", "state": "Karnataka", "code": "BLR", "is_popular": True},
        {"name": "Chennai", "state": "Tamil Nadu", "code": "MAA", "is_popular": True},
        {"name": "Hyderabad", "state": "Telangana", "code": "HYD", "is_popular": True},
        {"name": "Mumbai", "state": "Maharashtra", "code": "BOM", "is_popular": True},
        {"name": "Pune", "state": "Maharashtra", "code": "PNQ", "is_popular": True},
        {"name": "Goa", "state": "Goa", "code": "GOI", "is_popular": True},
        {"name": "Mysuru", "state": "Karnataka", "code": "MYS", "is_popular": True},
        {"name": "Coimbatore", "state": "Tamil Nadu", "code": "CJB", "is_popular": True},
        {"name": "Delhi", "state": "Delhi", "code": "DEL", "is_popular": True},
        {"name": "Jaipur", "state": "Rajasthan", "code": "JAI", "is_popular": True},
        {"name": "Mangaluru", "state": "Karnataka", "code": "IXE", "is_popular": False},
        {"name": "Hubli", "state": "Karnataka", "code": "HBX", "is_popular": False},
        {"name": "Vijayawada", "state": "Andhra Pradesh", "code": "VGA", "is_popular": False},
        {"name": "Tirupati", "state": "Andhra Pradesh", "code": "TIR", "is_popular": False},
        {"name": "Nashik", "state": "Maharashtra", "code": "ISK", "is_popular": False},
        {"name": "Kochi", "state": "Kerala", "code": "COK", "is_popular": False},
        {"name": "Thiruvananthapuram", "state": "Kerala", "code": "TRV", "is_popular": False},
        {"name": "Udaipur", "state": "Rajasthan", "code": "UDR", "is_popular": False},
        {"name": "Ahmedabad", "state": "Gujarat", "code": "AMD", "is_popular": False},
        {"name": "Indore", "state": "Madhya Pradesh", "code": "IDR", "is_popular": False},
    ]
    
    created = []
    for city_data in cities:
        city = City(**city_data)
        db.add(city)
        created.append(city)
    db.commit()
    print(f"✅ Created {len(created)} cities")
    return created


def create_routes(db: Session, cities):
    """Create routes between cities."""
    city_map = {c.code: c for c in cities}
    
    routes_data = [
        ("BLR", "MAA", 350, 360),
        ("BLR", "HYD", 570, 480),
        ("BLR", "MYS", 150, 180),
        ("BLR", "GOI", 560, 600),
        ("BLR", "PNQ", 840, 720),
        ("MAA", "BLR", 350, 360),
        ("MAA", "HYD", 630, 540),
        ("MAA", "CJB", 500, 420),
        ("HYD", "BLR", 570, 480),
        ("HYD", "VGA", 275, 300),
        ("BOM", "PNQ", 150, 180),
        ("BOM", "GOI", 590, 540),
        ("BOM", "BLR", 980, 900),
        ("PNQ", "BOM", 150, 180),
        ("PNQ", "GOI", 450, 420),
        ("DEL", "JAI", 280, 300),
        ("DEL", "UDR", 660, 720),
        ("MYS", "BLR", 150, 180),
        ("CJB", "MAA", 500, 420),
        ("GOI", "BLR", 560, 600),
        ("GOI", "BOM", 590, 540),
        ("IXE", "BLR", 350, 360),
        ("HBX", "BLR", 400, 420),
        ("TIR", "MAA", 130, 180),
        ("COK", "BLR", 550, 600),
        ("TRV", "COK", 210, 240),
        ("AMD", "BOM", 525, 480),
        ("IDR", "BOM", 585, 600),
        ("JAI", "DEL", 280, 300),
        ("JAI", "UDR", 400, 420),
    ]
    
    created = []
    for from_code, to_code, distance, duration in routes_data:
        from_city = city_map.get(from_code)
        to_city = city_map.get(to_code)
        if from_city and to_city:
            route = Route(
                from_city_id=from_city.id,
                to_city_id=to_city.id,
                distance_km=distance,
                duration_minutes=duration
            )
            db.add(route)
            created.append(route)
    db.commit()
    print(f"✅ Created {len(created)} routes")
    return created


def create_buses(db: Session, operators):
    """Create buses for operators."""
    bus_types = [
        ("seater", 40, "2+2"),
        ("sleeper", 30, "2+1"),
        ("semi-sleeper", 36, "2+2"),
        ("ac-sleeper", 30, "2+1"),
        ("ac-seater", 45, "2+2"),
    ]
    
    amenities_list = [
        ["wifi", "charging", "water"],
        ["wifi", "blanket", "snacks", "charging"],
        ["charging", "water"],
        ["wifi", "blanket", "charging", "entertainment", "snacks"],
        ["water", "blanket"],
    ]
    
    created = []
    bus_counter = 1
    
    for operator in operators:
        for i, (bus_type, seats, layout) in enumerate(bus_types):
            bus = Bus(
                operator_id=operator.id,
                bus_number=f"{operator.code}-{bus_counter:03d}",
                bus_type=bus_type,
                total_seats=seats,
                seat_layout=layout,
                amenities=amenities_list[i % len(amenities_list)]
            )
            db.add(bus)
            created.append(bus)
            bus_counter += 1
    
    db.commit()
    print(f"✅ Created {len(created)} buses")
    return created


def create_schedules(db: Session, buses, routes):
    """Create bus schedules for the next 7 days."""
    today = date.today()
    
    departure_times = [
        time(6, 0), time(7, 30), time(9, 0), time(10, 30),
        time(14, 0), time(16, 0), time(18, 0), time(20, 0),
        time(21, 0), time(22, 0), time(23, 0)
    ]
    
    base_prices = {
        "seater": 400,
        "semi-sleeper": 600,
        "sleeper": 800,
        "ac-seater": 700,
        "ac-sleeper": 1200
    }
    
    created_schedules = []
    
    for day_offset in range(7):
        travel_date = today + timedelta(days=day_offset)
        
        for i, bus in enumerate(buses[:30]):
            route = routes[i % len(routes)]
            dep_time = departure_times[i % len(departure_times)]
            
            duration_hours = route.duration_minutes // 60
            arrival_hour = (dep_time.hour + duration_hours) % 24
            arr_time = time(arrival_hour, dep_time.minute)
            
            base_price = base_prices.get(bus.bus_type, 500)
            if travel_date.weekday() >= 5:
                base_price = int(base_price * 1.2)
            
            existing = db.query(BusSchedule).filter(
                BusSchedule.bus_id == bus.id,
                BusSchedule.travel_date == travel_date
            ).first()
            
            if not existing:
                schedule = BusSchedule(
                    bus_id=bus.id,
                    route_id=route.id,
                    travel_date=travel_date,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    base_price=base_price,
                    available_seats=bus.total_seats,
                    status="scheduled"
                )
                db.add(schedule)
                db.flush()
                
                # Create seats with proper layout
                create_seats(db, schedule, bus)
                
                # Create boarding and dropping points
                create_boarding_dropping_points(db, schedule, route, dep_time, arr_time)
                
                created_schedules.append(schedule)
    
    db.commit()
    print(f"✅ Created {len(created_schedules)} bus schedules")


def create_seats(db: Session, schedule: BusSchedule, bus: Bus):
    """Create seats for a bus schedule with proper layout (left/right sides with aisle)."""
    layout = bus.seat_layout  # e.g., "2+1" or "2+2"
    layout_parts = [int(x) for x in layout.split("+")]
    left_cols = layout_parts[0]  # Left side seats
    right_cols = layout_parts[1] if len(layout_parts) > 1 else 0  # Right side seats
    
    total_seats = bus.total_seats
    cols = left_cols + right_cols
    rows = total_seats // cols
    
    is_sleeper = "sleeper" in bus.bus_type.lower()
    
    seat_counter = 1
    decks = ["lower", "upper"] if is_sleeper else ["lower"]
    
    for deck in decks:
        deck_rows = rows // 2 if is_sleeper else rows
        
        for row in range(1, deck_rows + 1):
            # LEFT SIDE seats
            for col in range(1, left_cols + 1):
                if seat_counter > total_seats:
                    break
                
                is_window = (col == 1)  # First column on left is window
                seat_type = "sleeper" if is_sleeper else "seater"
                
                # Seat numbering: L1, L2... for left, R1, R2... for right
                if is_sleeper:
                    prefix = "L" if deck == "lower" else "U"
                    seat_number = f"{prefix}{seat_counter}"
                else:
                    # Row letter + seat number (A1, A2, B1, B2...)
                    row_letter = chr(64 + row)
                    seat_number = f"{row_letter}{col}"
                
                # Price variation
                price = schedule.base_price
                if is_window:
                    price *= 1.1
                if deck == "lower" and is_sleeper:
                    price *= 1.15
                
                seat = Seat(
                    bus_schedule_id=schedule.id,
                    seat_number=seat_number,
                    seat_type=seat_type,
                    price=round(price, 2),
                    is_available=True,
                    is_ladies_only=(row == deck_rows and col == 1),
                    row_number=row,
                    column_number=col,
                    deck=deck,
                    side="left",
                    is_window=is_window
                )
                db.add(seat)
                seat_counter += 1
            
            # RIGHT SIDE seats
            for col in range(1, right_cols + 1):
                if seat_counter > total_seats:
                    break
                
                is_window = (col == right_cols)  # Last column on right is window
                seat_type = "sleeper" if is_sleeper else "seater"
                
                if is_sleeper:
                    prefix = "L" if deck == "lower" else "U"
                    seat_number = f"{prefix}{seat_counter}"
                else:
                    row_letter = chr(64 + row)
                    seat_number = f"{row_letter}{left_cols + col}"
                
                price = schedule.base_price
                if is_window:
                    price *= 1.1
                if deck == "lower" and is_sleeper:
                    price *= 1.15
                
                seat = Seat(
                    bus_schedule_id=schedule.id,
                    seat_number=seat_number,
                    seat_type=seat_type,
                    price=round(price, 2),
                    is_available=True,
                    is_ladies_only=(row == deck_rows and col == right_cols),
                    row_number=row,
                    column_number=left_cols + col,
                    deck=deck,
                    side="right",
                    is_window=is_window
                )
                db.add(seat)
                seat_counter += 1


def create_boarding_dropping_points(db: Session, schedule: BusSchedule, route, dep_time: time, arr_time: time):
    """Create boarding and dropping points for a schedule."""
    from_city = route.from_city
    to_city = route.to_city
    
    # Boarding points (from city locations)
    boarding_locations = [
        (f"{from_city.name} Bus Stand", "Main Bus Terminal", 0),
        (f"{from_city.name} Railway Station", "Near Platform 1", 15),
        (f"{from_city.name} Outer Ring Road", "Toll Plaza Exit", 30),
    ]
    
    for name, landmark, minutes_offset in boarding_locations:
        board_hour = (dep_time.hour + (minutes_offset // 60)) % 24
        board_minute = (dep_time.minute + minutes_offset) % 60
        
        boarding = BoardingPoint(
            bus_schedule_id=schedule.id,
            name=name,
            address=f"{name}, {from_city.name}",
            landmark=landmark,
            time=time(board_hour, board_minute),
            contact_number="9876543210"
        )
        db.add(boarding)
    
    # Dropping points (to city locations)
    dropping_locations = [
        (f"{to_city.name} Bus Stand", "Main Bus Terminal", 0),
        (f"{to_city.name} Railway Station", "Near Main Exit", -15),
        (f"{to_city.name} City Center", "Central Mall", -30),
    ]
    
    for name, landmark, minutes_offset in dropping_locations:
        drop_hour = (arr_time.hour + (minutes_offset // 60)) % 24
        drop_minute = (arr_time.minute + minutes_offset) % 60
        if drop_minute < 0:
            drop_minute += 60
            drop_hour -= 1
        
        dropping = DroppingPoint(
            bus_schedule_id=schedule.id,
            name=name,
            address=f"{name}, {to_city.name}",
            landmark=landmark,
            time=time(drop_hour, drop_minute),
            contact_number="9876543210"
        )
        db.add(dropping)


def seed_database():
    """Main function to seed the database."""
    print("🚀 Starting database seed...")
    
    # Initialize database tables
    init_db()
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Operator).count() > 0:
            print("⚠️  Database already seeded. Skipping...")
            return
        
        operators = create_operators(db)
        cities = create_cities(db)
        routes = create_routes(db, cities)
        buses = create_buses(db, operators)
        create_schedules(db, buses, routes)
        
        print("✅ Database seeding complete!")
        
        # Print summary
        print(f"\n📊 Database Summary:")
        print(f"   Operators: {db.query(Operator).count()}")
        print(f"   Cities: {db.query(City).count()}")
        print(f"   Routes: {db.query(Route).count()}")
        print(f"   Buses: {db.query(Bus).count()}")
        print(f"   Schedules: {db.query(BusSchedule).count()}")
        print(f"   Seats: {db.query(Seat).count()}")
        print(f"   Boarding Points: {db.query(BoardingPoint).count()}")
        print(f"   Dropping Points: {db.query(DroppingPoint).count()}")
        
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
