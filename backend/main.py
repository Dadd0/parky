from backend.models import ParkingEvents, Cars, Users
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, status, Request
from scalar_fastapi import get_scalar_api_reference
from sqlmodel import Session, select

from backend.schemas import (
    CarLocation,
    HealthCheckResponse,
    LocationResponse,
    LocationUpdate,
    ParkingHistoryItem,
    UserResponse,
    UserCreate,
    CarCreate,
    CarResponse,
)
from backend.session import create_db_tables, get_session, get_current_user, get_client_ip


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
def get_available_cars(session: Session = Depends(get_session)) -> List[CarLocation]:
    cars = session.exec(select(Cars)).all()
    result = []
    for car in cars:
        latest = session.exec(
            select(ParkingEvents)
            .where(ParkingEvents.car_id == car.id)
            .order_by(ParkingEvents.parked_at.desc())
        ).first()

        parked_by = None
        if latest:
            user = session.get(Users, latest.user_id)
            if user:
                parked_by = user.name

        result.append(
            CarLocation(
                id=car.id,
                name=car.name,
                latitude=latest.latitude if latest else None,
                longitude=latest.longitude if latest else None,
                parked_at=latest.parked_at if latest else None,
                parked_by=parked_by,
            )
        )
    return result


@app.post("/location", tags=["location"], response_model=LocationResponse)
def update_location(
    payload: LocationUpdate,
    session: Session = Depends(get_session),
    user: Users = Depends(get_current_user),
):
    car = session.get(Cars, payload.car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Car not found"
        )
    event = ParkingEvents(
        car_id=payload.car_id,
        user_id=user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    session.add(event)
    session.commit()
    session.refresh(event)

    return event


@app.get("/cars/{car_id}/history")
def get_car_history(
    car_id: int, session: Session = Depends(get_session)
) -> List[ParkingHistoryItem]:
    events = session.exec(
        select(ParkingEvents)
        .where(ParkingEvents.car_id == car_id)
        .order_by(ParkingEvents.parked_at)
    ).all()
    return events


@app.get("/cars/{car_id}/rollback")
def rollback_location(car_id: int, session: Session = Depends(get_session)):
    latest = session.exec(
        select(ParkingEvents)
        .where(ParkingEvents.car_id == car_id)
        .order_by(ParkingEvents.parked_at.desc())
    ).first()
    session.delete(latest)
    session.commit()
    return {"detail": f"Deleted the location of car #{car_id}"}


@app.get("/health", tags=["healthcheck"], response_model=HealthCheckResponse)
def get_health():
    return HealthCheckResponse()


@app.get("/whoami")
def whoami(request: Request, session: Session = Depends(get_session)):
    client_ip = get_client_ip(request)
    raw_ip = request.client.host
    x_forwarded = request.headers.get("X-Forwarded-For")
    
    print(f"[WHOAMI] Raw IP: {raw_ip}, X-Forwarded-For: {x_forwarded}, Final IP: {client_ip}")

    user = session.exec(select(Users).where(Users.tailscale_ip == client_ip)).first()

    if user:
        return {
            "client_ip": client_ip,
            "known": True,
            "name": user.name,
            "user_id": user.id,
        }
    else:
        return {"client_ip": client_ip, "known": False, "name": None, "user_id": None}


@app.post("/users", tags=["setup"], response_model=UserResponse)
def create_user(
    payload: UserCreate, request: Request, session: Session = Depends(get_session)
):
    client_ip = get_client_ip(request)
    existing = session.exec(
        select(Users).where(Users.tailscale_ip == client_ip)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This device is already registered",
        )
    user = Users(name=payload.name, tailscale_ip=client_ip)
    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@app.post("/cars", tags=["setup"], response_model=CarResponse)
def create_car(
    payload: CarCreate,
    session: Session = Depends(get_session),
    user: Users = Depends(get_current_user),
):
    existing = session.exec(select(Cars).where(Cars.name == payload.name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This car was already registered",
        )
    car = Cars(name=payload.name)
    session.add(car)
    session.commit()
    session.refresh(car)

    return car


@app.get("/scalar", include_in_schema=False)
async def scalar_html():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url, scalar_proxy_url="https://proxy.scalar.com"
    )
