from sqlmodel import Field, SQLModel
from datetime import datetime


class Cars(SQLModel, table=True):
    __tablename__ = "cars"
    id: int | None = Field(default=None, primary_key=True)
    name: str


class Users(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    name: str
    tailscale_ip: str | None = Field(default=None, unique=True)


class ParkingEvents(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    car_id: int = Field(foreign_key="cars.id")
    user_id: int = Field(foreign_key="users.id")
    latitude: float
    longitude: float
    parked_at: datetime = Field(default_factory=datetime.now)
