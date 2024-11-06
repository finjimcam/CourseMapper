from typing import Union, Any, Annotated
from contextlib import asynccontextmanager
from .models.database import create_db_and_tables, get_session
from .models.models import (
    User,
    PermissionsGroup,
    Workbook,
    Course,
    LearningPlatform,
    LearningActivity,
    Week,
    Activity,
    WorkbookContributors,
)
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


@app.get("/courses/")
def read_courses(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Course]:
    courses = session.exec(select(Course).offset(offset).limit(limit)).all()
    return courses


@app.get("/learning_platforms/")
def read_learning_platforms(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[LearningPlatform]:
    learning_platforms = session.exec(
        select(LearningPlatform).offset(offset).limit(limit)
    ).all()
    return learning_platforms


@app.get("/learning_activities/")
def read_learning_activities(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[LearningActivity]:
    learning_activities = session.exec(
        select(LearningActivity).offset(offset).limit(limit)
    ).all()
    return learning_activities


@app.get("/weeks/")
def read_weeks(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Week]:
    weeks = session.exec(select(Week).offset(offset).limit(limit)).all()
    return weeks


@app.get("/workbook_contributors/")
def read_workbook_contributors(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[WorkbookContributors]:
    workbook_contributors = session.exec(
        select(WorkbookContributors).offset(offset).limit(limit)
    ).all()
    return workbook_contributors


@app.get("/activities/")
def read_activities(
    session: SessionDep,
    offset: int = 0,
    limit: Annotated[int, Query(le=100)] = 100,
) -> list[Activity]:
    activities = session.exec(select(Activity).offset(offset).limit(limit)).all()
    return activities
