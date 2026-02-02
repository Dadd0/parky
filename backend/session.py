from fastapi import Request, Depends, HTTPException, status
from sqlmodel import create_engine, SQLModel, Session, select
from backend.models import Cars, Users
from pathlib import Path

DB_FILE = Path(__file__).resolve().parent / "data" / "data.db"
sqlite_url = f"sqlite:///{DB_FILE}"

engine = create_engine(sqlite_url, echo=True)


def create_db_tables():
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def get_current_user(request: Request, session: Session = Depends(get_session)):
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    else:
        client_ip = request.client.host

    user = session.exec(select(Users).where(Users.tailscale_ip == client_ip)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=f"Unknown device: {client_ip}"
        )
    return user
