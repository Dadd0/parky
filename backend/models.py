from sqlmodel import Field, SQLModel


class Cars(SQLModel, table=True):
    __tablename__ = "cars"
    id: int | None = Field(default=None, primary_key=True)
    name: str
