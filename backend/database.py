from concurrent.interpreters import create
from sqlmodel import create_engine, SQLModel
from models import Cars
from pathlib import Path

DB_FILE = Path("data/data.db")
sqlite_url = f"sqlite:///{DB_FILE}"

engine = create_engine(sqlite_url, echo=True)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


if __name__ == "__main__":
    create_db_and_tables()
