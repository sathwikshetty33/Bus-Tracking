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
