from typing import Union, Annotated, AsyncGenerator, List
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from sqlmodel import Session, select

from backend.models.database import (
    create_db_and_tables,
    get_session,
)
from backend.models.models import (
    User,
    PermissionsGroup,
    Course,
    Week,
    Workbook,
    Activity,
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    LearningType,
)

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def read_root() -> dict[str, str]:
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(
    item_id: int, q: Union[str, None] = None
) -> dict[str, Union[int, str, None]]:
    return {"item_id": item_id, "q": q}


# Endpoints to fetch individual tables for testing purposes
@app.get("/users/")
def read_users(session: Session = Depends(get_session)) -> List[User]:
    users = list(session.exec(select(User)).all())
    return users


@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    permissions_groups = list(session.exec(select(PermissionsGroup)).all())
    return permissions_groups


@app.get("/courses/")
def read_courses(session: Session = Depends(get_session)) -> List[Course]:
    courses = list(session.exec(select(Course)).all())
    return courses


@app.get("/learning-platforms/")
def read_learning_platforms(
    session: Session = Depends(get_session),
) -> List[LearningPlatform]:
    learning_platforms = list(session.exec(select(LearningPlatform)).all())
    return learning_platforms


@app.get("/learning-activities/")
def read_learning_activities(
    session: Session = Depends(get_session),
) -> List[LearningActivity]:
    learning_activities = list(session.exec(select(LearningActivity)).all())
    return learning_activities


@app.get("/task-statuses/")
def read_task_statuses(session: Session = Depends(get_session)) -> List[TaskStatus]:
    task_statuses = list(session.exec(select(TaskStatus)).all())
    return task_statuses


@app.get("/learning-types/")
def read_learning_types(session: Session = Depends(get_session)) -> List[LearningType]:
    learning_types = list(session.exec(select(LearningType)).all())
    return learning_types


@app.get("/workbooks/")
def read_workbooks(session: Session = Depends(get_session)) -> List[Workbook]:
    workbooks = list(session.exec(select(Workbook)).all())
    return workbooks


@app.get("/weeks/")
def read_weeks(session: Session = Depends(get_session)) -> List[Week]:
    weeks = list(session.exec(select(Week)).all())
    return weeks


@app.get("/activities/")
def read_activities(session: Session = Depends(get_session)) -> List[Activity]:
    activities = list(session.exec(select(Activity)).all())
    return activities
