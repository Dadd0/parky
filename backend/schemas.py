from pydantic import BaseModel
from datetime import datetime


class HealthCheckResponse(BaseModel):
    status: str = "OK"


class LocationUpdate(BaseModel):
    car_id: int
    latitude: float
    longitude: float


class LocationResponse(BaseModel):
    latitude: float
    longitude: float
    updated_at: datetime
