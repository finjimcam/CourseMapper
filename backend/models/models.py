from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select


class User(SQLModel, table=True):
    id: int = Field(nullable=False, primary_key=True)
    name: str = Field(index=True)
