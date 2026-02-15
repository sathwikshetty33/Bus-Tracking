from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.bus import Bus, Route, BusSchedule, City
from app.database import DATABASE_URL

def check_stats():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    buses_count = session.query(Bus).count()
    routes_count = session.query(Route).count()
    schedules_count = session.query(BusSchedule).count()
    cities_count = session.query(City).count()

    print(f"Buses: {buses_count}")
    print(f"Routes: {routes_count}")
    print(f"Schedules: {schedules_count}")
    print(f"Cities: {cities_count}")

    session.close()

if __name__ == "__main__":
    check_stats()
