from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.bus import Bus, Route, BusSchedule, Seat, Operator, City
from ..models.booking import Booking
from ..schemas.user import UserResponse
from ..utils.dependencies import get_current_user
from pydantic import BaseModel
from datetime import date, time

router = APIRouter(prefix="/admin", tags=["Admin"])


class BusCreate(BaseModel):
    operator_id: int
    bus_number: str
    bus_type: str
    total_seats: int
    seat_layout: str
    amenities: List[str]

class RouteCreate(BaseModel):
    from_city_id: int
    to_city_id: int
    distance_km: float
    duration_minutes: int

class CityCreate(BaseModel):
    name: str
    state: str
    code: str
    is_popular: bool = False

def check_admin(user: User = Depends(get_current_user)):
    if user.role != "admin" and user.role != "admin123": # responding to user prompt admin123 requirement
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    total_users = db.query(User).count()
    total_buses = db.query(Bus).count()
    total_routes = db.query(Route).count()
    total_bookings = db.query(Booking).count()
    
    return {
        "users": total_users,
        "buses": total_buses,
        "routes": total_routes,
        "bookings": total_bookings
    }

@router.get("/operators")
def get_operators(db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    return db.query(Operator).all()

# City Management
@router.post("/cities")
def create_city(city: CityCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    db_city = City(**city.dict())
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city

# Bus Management
@router.get("/buses")
def get_buses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    return db.query(Bus).options(joinedload(Bus.operator)).offset(skip).limit(limit).all()

@router.post("/buses")
def create_bus(bus: BusCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    db_bus = Bus(**bus.dict())
    db.add(db_bus)
    db.commit()
    db.refresh(db_bus)
    return db_bus

@router.put("/buses/{bus_id}")
def update_bus(bus_id: int, bus: BusCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    db_bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not db_bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    for key, value in bus.dict().items():
        setattr(db_bus, key, value)
    
    db.commit()
    db.refresh(db_bus)
    return db_bus

@router.delete("/buses/{bus_id}")
def delete_bus(bus_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    db_bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not db_bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    db.delete(db_bus)
    db.commit()
    return {"message": "Bus deleted successfully"}

# Route Management
@router.get("/routes")
def get_routes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    return db.query(Route).options(joinedload(Route.from_city), joinedload(Route.to_city)).offset(skip).limit(limit).all()

@router.post("/routes")
def create_route(route: RouteCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    db_route = Route(**route.dict())
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    return db_route

@router.delete("/routes/{route_id}")
def delete_route(route_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    db_route = db.query(Route).filter(Route.id == route_id).first()
    if not db_route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    db.delete(db_route)
    db.commit()
    return {"message": "Route deleted successfully"}

# Ticket Management
@router.get("/bookings")
def get_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    return db.query(Booking).offset(skip).limit(limit).all()

@router.put("/bookings/{booking_id}/cancel")
def cancel_booking_admin(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = "cancelled"
    # Logic to refund should be here usually
    db.commit()
    return {"message": "Booking cancelled by admin"}

# Schedule Management
class ScheduleCreate(BaseModel):
    bus_id: int
    route_id: int
    travel_date: date
    departure_time: time
    base_price: float

@router.get("/schedules")
def get_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    return db.query(BusSchedule).options(
        joinedload(BusSchedule.bus),
        joinedload(BusSchedule.route).joinedload(Route.from_city),
        joinedload(BusSchedule.route).joinedload(Route.to_city)
    ).order_by(BusSchedule.travel_date.desc()).offset(skip).limit(limit).all()

@router.post("/schedules")
def create_schedule(schedule: ScheduleCreate, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    # 1. Verify Bus and Route existence as well as consistency
    bus = db.query(Bus).filter(Bus.id == schedule.bus_id).first()
    route = db.query(Route).filter(Route.id == schedule.route_id).first()
    
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    # 2. Calculate arrival time
    # This is a simplification. Ideally, we handle date crossing.
    from datetime import datetime, timedelta
    dummy_date = datetime.combine(date.today(), schedule.departure_time)
    arrival_datetime = dummy_date + timedelta(minutes=route.duration_minutes)
    arrival_time = arrival_datetime.time()

    # 3. Create Schedule
    db_schedule = BusSchedule(
        bus_id=schedule.bus_id,
        route_id=schedule.route_id,
        travel_date=schedule.travel_date,
        departure_time=schedule.departure_time,
        arrival_time=arrival_time,
        base_price=schedule.base_price,
        available_seats=bus.total_seats,
        status="scheduled"
    )
    db.add(db_schedule)
    db.flush() # Flush to get ID

    # 4. Generate Seats (Logic adapted from seed_data.py)
    # This should logically be in a service/utils function but keeping here for simplicity in this agent task
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
            # Left side
            for col in range(left_cols):
                if seat_counter > total_seats: break
                seat = Seat(
                    bus_schedule_id=db_schedule.id,
                    seat_number=f"{seat_labels[col]}{row}",
                    row_number=row,
                    column_number=col + 1,
                    deck=deck,
                    seat_type=bus.bus_type,
                    price=schedule.base_price, # Simplified price logic
                    is_available=True,
                    is_ladies_only=(row % 5 == 0), # Simplified logic
                    side="left",
                    is_window=(col == 0)
                )
                db.add(seat)
                seat_counter += 1
            
            # Right side
            for col in range(right_cols):
                if seat_counter > total_seats: break
                col_offset = left_cols + col
                seat = Seat(
                    bus_schedule_id=db_schedule.id,
                    seat_number=f"{seat_labels[col_offset]}{row}",
                    row_number=row,
                    column_number=col_offset + 1,
                    deck=deck,
                    seat_type=bus.bus_type,
                    price=schedule.base_price,
                    is_available=True,
                    is_ladies_only=False,
                    side="right",
                    is_window=(col == right_cols - 1)
                )
                db.add(seat)
                seat_counter += 1

    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: User = Depends(check_admin)):
    schedule = db.query(BusSchedule).filter(BusSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}
