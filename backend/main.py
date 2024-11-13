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
    Workbook,
)

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)


# Fetch all Users
@app.get("/users/")
def read_users(session: Session = Depends(get_session)) -> List[User]:
    users = list(session.exec(select(User)).all())
    return users


# Fetch all PermissionsGroups
@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    permissions_groups = list(session.exec(select(PermissionsGroup)).all())
    return permissions_groups


# Fetch all Courses
@app.get("/courses/")
def read_courses(session: Session = Depends(get_session)) -> List[Course]:
    courses = list(session.exec(select(Course)).all())
    return courses


# Fetch all LearningPlatforms
@app.get("/learning-platforms/")
def read_learning_platforms(
    session: Session = Depends(get_session),
) -> List[LearningPlatform]:
    learning_platforms = list(session.exec(select(LearningPlatform)).all())
    return learning_platforms


# Fetch all LearningActivities
@app.get("/learning-activities/")
def read_learning_activities(
    session: Session = Depends(get_session),
) -> List[LearningActivity]:
    learning_activities = list(session.exec(select(LearningActivity)).all())
    return learning_activities


# Fetch all TaskStatuses
@app.get("/task-statuses/")
def read_task_statuses(session: Session = Depends(get_session)) -> List[TaskStatus]:
    task_statuses = list(session.exec(select(TaskStatus)).all())
    return task_statuses


# Fetch all LearningTypes
@app.get("/learning-types/")
def read_learning_types(session: Session = Depends(get_session)) -> List[LearningType]:
    learning_types = list(session.exec(select(LearningType)).all())
    return learning_types


# Fetches all or a specified workbooks
@app.get("/workbooks/")
def read_workbooks(
    workbook_id: int | None = None,
    session: Session = Depends(get_session),
) -> List[Workbook]:
    if not workbook_id:
        return list(session.exec(select(Workbook)).all())
    return list(session.exec(select(Workbook).where(Workbook.id == workbook_id)))


# Fetches all activities for a specified workbook week or specified activity
@app.get("/activities/")
def read_workbook_week(
    workbook_id: int | None = None,
    week_number: int | None = None,
    session: Session = Depends(get_session),
) -> List[Activity]:
    if not workbook_id:
        return list(session.exec(select(Activity)).all())
    if not week_number:
        return list(
            session.exec(select(Activity).where(Activity.workbook_id == workbook_id))
        )
    return list(
        session.exec(
            select(Activity).where(
                Activity.workbook_id == workbook_id
                and Activity.week_number == week_number
            )
        )
    )
