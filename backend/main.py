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
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    LearningType,
    Activity,
    Workbook
)

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

# TODO: delete this
@app.get("/")
def read_root() -> dict[str, str]:
    return {"Hello": "World"}


# Endpoint to fetch all Users
@app.get("/users/")
def read_users(session: Session = Depends(get_session)) -> List[User]:
    users = list(session.exec(select(User)).all())
    return users


# Endpoint to fetch all PermissionsGroups
@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    permissions_groups = list(session.exec(select(PermissionsGroup)).all())
    return permissions_groups


# Endpoint to fetch all Courses
@app.get("/courses/")
def read_courses(session: Session = Depends(get_session)) -> List[Course]:
    courses = list(session.exec(select(Course)).all())
    return courses


# Endpoint to fetch all LearningPlatforms
@app.get("/learning-platforms/")
def read_learning_platforms(
    session: Session = Depends(get_session),
) -> List[LearningPlatform]:
    learning_platforms = list(session.exec(select(LearningPlatform)).all())
    return learning_platforms


# Endpoint to fetch all LearningActivities
@app.get("/learning-activities/")
def read_learning_activities(
    session: Session = Depends(get_session),
) -> List[LearningActivity]:
    learning_activities = list(session.exec(select(LearningActivity)).all())
    return learning_activities


# Endpoint to fetch all TaskStatuses
@app.get("/task-statuses/")
def read_task_statuses(session: Session = Depends(get_session)) -> List[TaskStatus]:
    task_statuses = list(session.exec(select(TaskStatus)).all())
    return task_statuses


# Endpoint to fetch all LearningTypes
@app.get("/learning-types/")
def read_learning_types(session: Session = Depends(get_session)) -> List[LearningType]:
    learning_types = list(session.exec(select(LearningType)).all())
    return learning_types


# Fetches a specified workbook
@app.get("/workbook/{workbook_id}/")
def read_workbook_week(workbook_id: int, session: Session = Depends(get_session)) -> List[Activity]:
    workbook = list(session.exec(select(Workbook)).where(Workbook.workbook_id==workbook_id))[0] 
    return workbook


# Fetches activities for a specified workbook week
@app.get("/activity/{workbook_id}/{week_number}/")
def read_workbook_week(workbook_id: int, week_number: int, 
                       session: Session = Depends(get_session)) -> List[Activity]:
    activities = list(session.exec(select(Activity)).where(Activity.workbook_id==workbook_id and Activity.week_number==week_number))
    return activities
