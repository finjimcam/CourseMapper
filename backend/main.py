from typing import Union, Any, Annotated, AsyncGenerator, List
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


# Endpoint to fetch all Users
@app.get("/users/")
def read_users(session: Session = Depends(get_session)) -> List[User]:
    users = session.exec(select(User)).all()
    return users


# Endpoint to fetch all PermissionsGroups
@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    permissions_groups = session.exec(select(PermissionsGroup)).all()
    return permissions_groups


# Endpoint to fetch all Courses
@app.get("/courses/")
def read_courses(session: Session = Depends(get_session)) -> List[Course]:
    courses = session.exec(select(Course)).all()
    return courses


# Endpoint to fetch all LearningPlatforms
@app.get("/learning-platforms/")
def read_learning_platforms(
    session: Session = Depends(get_session),
) -> List[LearningPlatform]:
    learning_platforms = session.exec(select(LearningPlatform)).all()
    return learning_platforms


# Endpoint to fetch all LearningActivities
@app.get("/learning-activities/")
def read_learning_activities(
    session: Session = Depends(get_session),
) -> List[LearningActivity]:
    learning_activities = session.exec(select(LearningActivity)).all()
    return learning_activities


# Endpoint to fetch all TaskStatuses
@app.get("/task-statuses/")
def read_task_statuses(session: Session = Depends(get_session)) -> List[TaskStatus]:
    task_statuses = session.exec(select(TaskStatus)).all()
    return task_statuses


# Endpoint to fetch all LearningTypes
@app.get("/learning-types/")
def read_learning_types(session: Session = Depends(get_session)) -> List[LearningType]:
    learning_types = session.exec(select(LearningType)).all()
    return learning_types
