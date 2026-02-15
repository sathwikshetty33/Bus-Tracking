"""
Seed script to populate database with comprehensive bus data.
50+ routes, 20 buses per route per day, for Dec 2025 - Jan 2026.
Run with: python -m app.seed_data
"""

from datetime import date, time, timedelta
import random
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models.bus import Operator, City, Route, Bus, BusSchedule, Seat, BoardingPoint, DroppingPoint


def create_operators(db: Session):
    """Create 15 bus operators."""
    operators = [
        {"name": "VRL Travels", "code": "VRL", "rating": 4.5},
        {"name": "SRS Travels", "code": "SRS", "rating": 4.3},
        {"name": "KSRTC", "code": "KSRTC", "rating": 4.0},
        {"name": "Orange Travels", "code": "ORANGE", "rating": 4.2},
        {"name": "Sugama Travels", "code": "SUGAMA", "rating": 4.4},
        {"name": "Neeta Travels", "code": "NEETA", "rating": 4.1},
        {"name": "Paulo Travels", "code": "PAULO", "rating": 4.6},
        {"name": "Greenline Travels", "code": "GREEN", "rating": 4.2},
        {"name": "Sharma Transports", "code": "SHARMA", "rating": 3.9},
        {"name": "IntrCity SmartBus", "code": "INTRCITY", "rating": 4.7},
        {"name": "Volvo Bus", "code": "VOLVO", "rating": 4.8},
        {"name": "RedBus Express", "code": "REDBUS", "rating": 4.3},
        {"name": "Zingbus", "code": "ZING", "rating": 4.4},
        {"name": "Yatra Express", "code": "YATRA", "rating": 4.1},
        {"name": "National Travels", "code": "NATL", "rating": 4.0},
    ]
    
    created = []
    for op_data in operators:
        operator = Operator(**op_data, total_buses=20, logo_url=None)
        db.add(operator)
        created.append(operator)
    db.commit()
    print(f"✅ Created {len(created)} operators")
    return created


def create_cities(db: Session):
    """Create 25 cities across India."""
    cities = [
        # South India
        {"name": "Bengaluru", "state": "Karnataka", "code": "BLR", "is_popular": True},
        {"name": "Chennai", "state": "Tamil Nadu", "code": "MAA", "is_popular": True},
        {"name": "Hyderabad", "state": "Telangana", "code": "HYD", "is_popular": True},
        {"name": "Mysuru", "state": "Karnataka", "code": "MYS", "is_popular": True},
        {"name": "Coimbatore", "state": "Tamil Nadu", "code": "CJB", "is_popular": True},
        {"name": "Kochi", "state": "Kerala", "code": "COK", "is_popular": True},
        {"name": "Thiruvananthapuram", "state": "Kerala", "code": "TRV", "is_popular": False},
        {"name": "Mangaluru", "state": "Karnataka", "code": "IXE", "is_popular": False},
        {"name": "Hubli", "state": "Karnataka", "code": "HBX", "is_popular": False},
        {"name": "Vijayawada", "state": "Andhra Pradesh", "code": "VGA", "is_popular": False},
        {"name": "Tirupati", "state": "Andhra Pradesh", "code": "TIR", "is_popular": False},
        {"name": "Madurai", "state": "Tamil Nadu", "code": "IXM", "is_popular": False},
        {"name": "Visakhapatnam", "state": "Andhra Pradesh", "code": "VTZ", "is_popular": True},
        # West India
        {"name": "Mumbai", "state": "Maharashtra", "code": "BOM", "is_popular": True},
        {"name": "Pune", "state": "Maharashtra", "code": "PNQ", "is_popular": True},
        {"name": "Goa", "state": "Goa", "code": "GOI", "is_popular": True},
        {"name": "Nashik", "state": "Maharashtra", "code": "ISK", "is_popular": False},
        {"name": "Ahmedabad", "state": "Gujarat", "code": "AMD", "is_popular": True},
        {"name": "Surat", "state": "Gujarat", "code": "STV", "is_popular": False},
        # North India
        {"name": "Delhi", "state": "Delhi", "code": "DEL", "is_popular": True},
        {"name": "Jaipur", "state": "Rajasthan", "code": "JAI", "is_popular": True},
        {"name": "Udaipur", "state": "Rajasthan", "code": "UDR", "is_popular": False},
        {"name": "Indore", "state": "Madhya Pradesh", "code": "IDR", "is_popular": False},
        {"name": "Lucknow", "state": "Uttar Pradesh", "code": "LKO", "is_popular": True},
        {"name": "Chandigarh", "state": "Chandigarh", "code": "IXC", "is_popular": False},
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
    """Create 50+ routes between cities."""
    city_map = {c.code: c for c in cities}
    
    # (from_code, to_code, distance_km, duration_minutes)
    routes_data = [
        # From Bengaluru
        ("BLR", "MAA", 350, 360), ("BLR", "HYD", 570, 480), ("BLR", "MYS", 150, 180),
        ("BLR", "GOI", 560, 600), ("BLR", "PNQ", 840, 720), ("BLR", "BOM", 980, 900),
        ("BLR", "COK", 550, 540), ("BLR", "IXE", 350, 360), ("BLR", "HBX", 400, 420),
        ("BLR", "CJB", 370, 360), ("BLR", "TIR", 250, 300),
        # From Chennai
        ("MAA", "BLR", 350, 360), ("MAA", "HYD", 630, 540), ("MAA", "CJB", 500, 420),
        ("MAA", "TIR", 130, 180), ("MAA", "IXM", 460, 420), ("MAA", "VTZ", 780, 720),
        # From Hyderabad
        ("HYD", "BLR", 570, 480), ("HYD", "MAA", 630, 540), ("HYD", "VGA", 275, 300),
        ("HYD", "VTZ", 620, 600), ("HYD", "BOM", 710, 660), ("HYD", "PNQ", 560, 540),
        # From Mumbai
        ("BOM", "PNQ", 150, 180), ("BOM", "GOI", 590, 540), ("BOM", "BLR", 980, 900),
        ("BOM", "HYD", 710, 660), ("BOM", "AMD", 525, 480), ("BOM", "STV", 284, 300),
        ("BOM", "ISK", 185, 210), ("BOM", "IDR", 585, 600),
        # From Pune
        ("PNQ", "BOM", 150, 180), ("PNQ", "GOI", 450, 420), ("PNQ", "BLR", 840, 720),
        ("PNQ", "HYD", 560, 540),
        # From Goa
        ("GOI", "BLR", 560, 600), ("GOI", "BOM", 590, 540), ("GOI", "PNQ", 450, 420),
        # From Delhi
        ("DEL", "JAI", 280, 300), ("DEL", "UDR", 660, 720), ("DEL", "LKO", 555, 540),
        ("DEL", "IXC", 250, 270), ("DEL", "IDR", 810, 780),
        # From Jaipur
        ("JAI", "DEL", 280, 300), ("JAI", "UDR", 400, 420), ("JAI", "AMD", 670, 660),
        # From Kerala
        ("COK", "BLR", 550, 540), ("COK", "TRV", 210, 240), ("TRV", "COK", 210, 240),
        ("TRV", "BLR", 750, 720),
        # From Ahmedabad
        ("AMD", "BOM", 525, 480), ("AMD", "STV", 265, 270), ("AMD", "JAI", 670, 660),
        # Return routes for major pairs
        ("MYS", "BLR", 150, 180), ("CJB", "MAA", 500, 420), ("CJB", "BLR", 370, 360),
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
    """Create 20 buses per operator (300 total)."""
    bus_types = ["seater", "sleeper", "semi-sleeper", "ac-sleeper", "ac-seater"]
    seat_counts = {"seater": 40, "sleeper": 30, "semi-sleeper": 36, "ac-sleeper": 30, "ac-seater": 45}
    layouts = {"seater": "2+2", "sleeper": "2+1", "semi-sleeper": "2+2", "ac-sleeper": "2+1", "ac-seater": "2+2"}
    
    amenities_options = [
        ["wifi", "charging", "water"],
        ["wifi", "blanket", "snacks", "charging"],
        ["charging", "water"],
        ["wifi", "blanket", "charging", "entertainment", "snacks"],
        ["water", "blanket", "charging"],
        ["wifi", "charging", "water", "snacks"],
    ]
    
    created = []
    bus_counter = 1
    
    for operator in operators:
        for i in range(20):  # 20 buses per operator
            bus_type = bus_types[i % len(bus_types)]
            bus = Bus(
                operator_id=operator.id,
                bus_number=f"{operator.code}-{bus_counter:03d}",
                bus_type=bus_type,
                total_seats=seat_counts[bus_type],
                seat_layout=layouts[bus_type],
                amenities=random.choice(amenities_options)
            )
            db.add(bus)
            created.append(bus)
            bus_counter += 1
    
    db.commit()
    print(f"✅ Created {len(created)} buses")
    return created


def create_schedules_bulk(db: Session, buses, routes):
    """Create bus schedules for past 1 month and future 2 months."""
    today = date.today()
    start_date = today - timedelta(days=30)
    end_date = today + timedelta(days=60)
    
    # 20 departure times throughout the day
    departure_times = [
        time(5, 0), time(6, 0), time(7, 0), time(7, 30), time(8, 0),
        time(9, 0), time(10, 0), time(11, 0), time(13, 0), time(14, 0),
        time(15, 0), time(16, 0), time(17, 0), time(18, 0), time(19, 0),
        time(20, 0), time(21, 0), time(21, 30), time(22, 0), time(23, 0)
    ]
    
    base_prices = {
        "seater": 400, "semi-sleeper": 600, "sleeper": 800,
        "ac-seater": 700, "ac-sleeper": 1200
    }
    
    # Calculate total days
    total_days = (end_date - start_date).days + 1
    print(f"📅 Generating schedules for {total_days} days ({start_date} to {end_date})")
    
    total_schedules = 0
    batch_size = 500
    
    # Group buses by route - ensure each route has 20 buses per day
    route_bus_map = {}
    for i, bus in enumerate(buses):
        route_idx = i % len(routes)
        route = routes[route_idx]
        if route.id not in route_bus_map:
            route_bus_map[route.id] = []
        route_bus_map[route.id].append(bus)
    
    for day_offset in range(total_days):
        travel_date = start_date + timedelta(days=day_offset)
        is_weekend = travel_date.weekday() >= 5
        
        # For each route, schedule 20 buses
        for route in routes:
            route_buses = route_bus_map.get(route.id, [])
            if not route_buses:
                # Use any available buses
                route_buses = buses[:20]
            
            for bus_idx, bus in enumerate(route_buses[:20]):
                # Assign a departure time
                dep_time = departure_times[bus_idx % len(departure_times)]
                
                # Calculate arrival time
                duration_hours = route.duration_minutes // 60
                duration_mins = route.duration_minutes % 60
                arrival_hour = (dep_time.hour + duration_hours) % 24
                arrival_min = (dep_time.minute + duration_mins) % 60
                arr_time = time(arrival_hour, arrival_min)
                
                # Calculate price with weekend surge
                base_price = base_prices.get(bus.bus_type, 500)
                price_variance = random.randint(-50, 100)
                final_price = base_price + price_variance
                if is_weekend:
                    final_price = int(final_price * 1.2)
                
                schedule = BusSchedule(
                    bus_id=bus.id,
                    route_id=route.id,
                    travel_date=travel_date,
                    departure_time=dep_time,
                    arrival_time=arr_time,
                    base_price=final_price,
                    available_seats=bus.total_seats,
                    status="scheduled"
                )
                db.add(schedule)
                total_schedules += 1
                
        # Commit in batches
        if total_schedules % batch_size == 0:
            db.flush()
            print(f"  Processed: {total_schedules} schedules (Day {day_offset + 1}/{total_days})")
    
    db.commit()
    print(f"✅ Created {total_schedules} bus schedules")
    return total_schedules


def create_seats_for_schedules(db: Session):
    """Create seats for all schedules."""
    schedules = db.query(BusSchedule).all()
    print(f"🪑 Creating seats for {len(schedules)} schedules...")
    
    seat_count = 0
    batch_size = 100
    
    for i, schedule in enumerate(schedules):
        bus = schedule.bus
        layout = bus.seat_layout
        layout_parts = [int(x) for x in layout.split("+")]
        left_cols = layout_parts[0]
        right_cols = layout_parts[1] if len(layout_parts) > 1 else 0
        
        total_seats = bus.total_seats
        cols = left_cols + right_cols
        rows = total_seats // cols
        
        is_sleeper = "sleeper" in bus.bus_type.lower()
        decks = ["lower", "upper"] if is_sleeper else ["lower"]
        
        seat_labels = ["A", "B", "C", "D", "E"]
        seat_counter = 1
        
        for deck in decks:
            deck_rows = rows // 2 if is_sleeper else rows
            for row in range(1, deck_rows + 1):
                # Left side seats
                for col in range(left_cols):
                    if seat_counter > total_seats:
                        break
                    seat = Seat(
                        bus_schedule_id=schedule.id,
                        seat_number=f"{seat_labels[col]}{row}",
                        row_number=row,
                        column_number=col + 1,
                        deck=deck,
                        seat_type=bus.bus_type,
                        price=schedule.base_price + (col * 10) + random.randint(0, 50),
                        is_available=True,
                        is_ladies_only=(row % 5 == 0),
                        side="left",
                        is_window=(col == 0)
                    )
                    db.add(seat)
                    seat_counter += 1
                    seat_count += 1
                
                # Right side seats
                for col in range(right_cols):
                    if seat_counter > total_seats:
                        break
                    col_offset = left_cols + col
                    seat = Seat(
                        bus_schedule_id=schedule.id,
                        seat_number=f"{seat_labels[col_offset]}{row}",
                        row_number=row,
                        column_number=col_offset + 1,
                        deck=deck,
                        seat_type=bus.bus_type,
                        price=schedule.base_price + (col * 10) + random.randint(0, 50),
                        is_available=True,
                        is_ladies_only=False,
                        side="right",
                        is_window=(col == right_cols - 1)
                    )
                    db.add(seat)
                    seat_counter += 1
                    seat_count += 1
        
        if (i + 1) % batch_size == 0:
            db.flush()
            print(f"  Processed seats for {i + 1}/{len(schedules)} schedules...")
    
    db.commit()
    print(f"✅ Created {seat_count} seats")


def create_boarding_dropping_bulk(db: Session):
    """Create boarding and dropping points for all schedules."""
    schedules = db.query(BusSchedule).all()
    print(f"📍 Creating boarding/dropping points for {len(schedules)} schedules...")
    
    boarding_templates = [
        ("Main Bus Stand", "Near Railway Station"),
        ("Central Terminal", "Opposite Mall"),
        ("Highway Pickup", "Toll Plaza"),
        ("City Center", "Near Metro"),
    ]
    
    dropping_templates = [
        ("Main Bus Stand", "Near Railway Station"),
        ("Central Terminal", "City Center"),
        ("Highway Drop", "Toll Gate"),
    ]
    
    point_count = 0
    batch_size = 100
    
    for i, schedule in enumerate(schedules):
        dep_hour = schedule.departure_time.hour
        arr_hour = schedule.arrival_time.hour
        
        # Boarding points
        for j, (name, landmark) in enumerate(boarding_templates):
            bp = BoardingPoint(
                bus_schedule_id=schedule.id,
                name=name,
                time=time((dep_hour + j * 15 // 60) % 24, (j * 15) % 60),
                landmark=landmark,
                address=f"{name}, City"
            )
            db.add(bp)
            point_count += 1
        
        # Dropping points
        for j, (name, landmark) in enumerate(dropping_templates):
            dp = DroppingPoint(
                bus_schedule_id=schedule.id,
                name=name,
                time=time((arr_hour + j * 10 // 60) % 24, (j * 10) % 60),
                landmark=landmark,
                address=f"{name}, City"
            )
            db.add(dp)
            point_count += 1
        
        if (i + 1) % batch_size == 0:
            db.flush()
            print(f"  Processed points for {i + 1}/{len(schedules)} schedules...")
    
    db.commit()
    print(f"✅ Created {point_count} boarding/dropping points")


def create_admin_user(db: Session):
    """Create default admin user."""
    from .models.user import User
    from .utils.security import get_password_hash
    
    admin_email = "admin"
    admin_password = "admin123"
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        print("ℹ️ Admin user already exists")
        return existing_admin
        
    admin = User(
        email=admin_email,
        phone="0000000000",
        password_hash=get_password_hash(admin_password),
        full_name="Administrator",
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.commit()
    print("✅ Created admin user (admin/admin123)")
    return admin


def seed_database():
    """Main function to seed the database."""
    print("\n" + "=" * 60)
    print("🚌 BUS BOOKING - DATABASE SEEDING")
    print("=" * 60)
    print("Generating comprehensive data for Dec 2025 - Jan 2026")
    print("50+ routes × 20 buses × 51 days = ~51,000 schedules\n")
    
    db = SessionLocal()
    
    try:
        # Clear existing data (order matters due to foreign key constraints)
        print("🗑️ Clearing existing data...")
        
        # Use TRUNCATE CASCADE to handle all foreign key constraints
        from sqlalchemy import text
        
        # Tables to truncate (order doesn't matter with CASCADE)
        tables_to_clear = [
            "booking_passengers",
            "bookings", 
            "chat_messages",
            "chat_sessions",
            "seats",
            "boarding_points",
            "dropping_points",
            "bus_schedules",
            "buses",
            "routes",
            # Don't delete cities and operators to preserve references
        ]
        
        for table in tables_to_clear:
            try:
                db.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
            except Exception as e:
                # Table might not exist, that's okay
                db.rollback()
                print(f"  ⚠️ Could not truncate {table}: {str(e)[:50]}...")
        
        db.commit()
        print("  ✓ Cleared existing data")
        
        # Delete cities and operators separately
        db.query(City).delete()
        db.query(Operator).delete()
        db.commit()
        print("  ✓ Cleared master data")
        
        # Create data
        operators = create_operators(db)
        cities = create_cities(db)
        routes = create_routes(db, cities)
        buses = create_buses(db, operators)
        
        print("\n👤 Creating admin user...")
        create_admin_user(db)
        
        print("\n📅 Creating schedules (this may take a few minutes)...")
        create_schedules_bulk(db, buses, routes)
        
        print("\n🪑 Creating seats for all schedules...")
        create_seats_for_schedules(db)
        
        print("\n📍 Creating boarding/dropping points...")
        create_boarding_dropping_bulk(db)
        
        print("\n" + "=" * 60)
        print("✅ DATABASE SEEDING COMPLETE!")
        print("=" * 60)
        
        # Summary
        print(f"\n📊 Summary:")
        print(f"   Operators: {db.query(Operator).count()}")
        print(f"   Cities: {db.query(City).count()}")
        print(f"   Routes: {db.query(Route).count()}")
        print(f"   Buses: {db.query(Bus).count()}")
        print(f"   Schedules: {db.query(BusSchedule).count()}")
        print(f"   Seats: {db.query(Seat).count()}")
        print(f"   Boarding Points: {db.query(BoardingPoint).count()}")
        print(f"   Dropping Points: {db.query(DroppingPoint).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_database()
