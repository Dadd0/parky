from pydantic import BaseModel
from datetime import datetime


class HealthCheckResponse(BaseModel):
    status: str = "OK"


class LocationUpdate(BaseModel):
    car_id: int
    latitude: float
    longitude: float


class LocationResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    parked_at: datetime


class CarCreate(BaseModel):
    name: str


class CarResponse(BaseModel):
    id: int
    name: str


class CarLocation(BaseModel):
    id: int
    name: str
    latitude: float | None = None
    longitude: float | None = None
    parked_at: datetime | None = None
    parked_by: str | None = None


class ParkingHistoryItem(BaseModel):
    id: int
    latitude: float
    longitude: float
    parked_at: datetime
    user_id: int


class UserCreate(BaseModel):
    name: str


class UserResponse(BaseModel):
    id: int
    name: str
    tailscale_ip: str
