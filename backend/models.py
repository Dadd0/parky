from sqlmodel import Field, SQLModel
from datetime import datetime


class Cars(SQLModel, table=True):
    __tablename__ = "cars"
    id: int | None = Field(default=None, primary_key=True)
    name: str
    latitude: float | None = None
    longitude: float | None = None
    updated_at: datetime | None = None


class Users(SQLModel, table=True):
    __tablename__ = "users"
    id: int | None = Field(default=None, primary_key=True)
    name: str
