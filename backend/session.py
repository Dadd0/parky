from sqlmodel import create_engine, SQLModel, Session
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


if __name__ == "__main__":
    create_db_tables()
