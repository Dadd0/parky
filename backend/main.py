from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status
from scalar_fastapi import get_scalar_api_reference
from sqlmodel import Session, select

from backend.models import Cars
from backend.schemas import HealthCheckResponse, LocationResponse, LocationUpdate
from backend.session import create_db_tables, get_session


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_tables()
    yield


app = FastAPI(title="Parky", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/cars")
def get_available_cars(session: Session = Depends(get_session)) -> List[Cars]:
    cars = session.exec(select(Cars)).all()
    return cars


@app.post("/location", tags=["location"], response_model=LocationResponse)
def update_location(payload: LocationUpdate, session: Session = Depends(get_session)):
    car = session.get(Cars, payload.car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )
    car.latitude = payload.latitude
    car.longitude = payload.longitude
    car.updated_at = datetime.now()

    session.commit()
    session.refresh(car)

    return LocationResponse(**car.model_dump())


@app.get("/health", tags=["healthcheck"], response_model=HealthCheckResponse)
def get_health():
    return HealthCheckResponse()


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url, scalar_proxy_url="https://proxy.scalar.com"
    )
