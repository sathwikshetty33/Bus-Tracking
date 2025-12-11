from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# PostgreSQL URL from environment or default
DATABASE_URL = "postgresql://neondb_owner:npg_FJDsUx3kS4fc@ep-polished-cherry-a1a65qyd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
# Create PostgreSQL engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    from .models import user, bus, booking, wallet  # noqa: F401
    Base.metadata.create_all(bind=engine)
