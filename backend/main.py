from typing import Union, Any, Annotated
from contextlib import asynccontextmanager
from .models.database import create_db_and_tables, get_session
from .models.models import User, PermissionsGroup, Workbook
from sqlmodel import Session, select
from fastapi import FastAPI, Depends, Query

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None) -> dict[str, Any]:
    return {"item_id": item_id, "q": q}


"""
The following views exist for the purpose of debugging the database as it's being created. DO NOT SUBMIT.
"""


@app.get("/users/")
def read_users(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[User]:
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users


@app.get("/permissions_groups/")
def read_permissions_groups(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[PermissionsGroup]:
    permissions_groups = session.exec(
        select(PermissionsGroup).offset(offset).limit(limit)
    ).all()
    return permissions_groups


@app.get("/workbooks/")
def read_workbooks(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Workbook]:
    workbooks = session.exec(select(Workbook).offset(offset).limit(limit)).all()
    return workbooks
