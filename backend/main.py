# main.py

from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
import uuid
from fastapi.middleware.cors import CORSMiddleware

from backend.models.database import create_db_and_tables, get_session
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

SessionDep = Depends(get_session)


@asynccontextmanager
async def lifespan(_: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


# Existing endpoints...

# New endpoint to fetch all workbook details and related data
@app.get("/workbooks/{workbook_id}/details")
def get_workbook_details(
    workbook_id: uuid.UUID,
    session: Session = Depends(get_session),
):
    workbook = session.get(Workbook, workbook_id)
    if not workbook:
        raise HTTPException(status_code=404, detail="Workbook not found")

    # Fetch related data using eager loading to minimize database queries
    workbook = session.exec(
        select(Workbook)
        .where(Workbook.id == workbook_id)
        .options(
            selectinload(Workbook.course),
            selectinload(Workbook.course_lead),
            selectinload(Workbook.learning_platform),
            selectinload(Workbook.activities)
            .selectinload(Activity.learning_activity),
            selectinload(Workbook.activities)
            .selectinload(Activity.learning_type),
            selectinload(Workbook.activities)
            .selectinload(Activity.task_status),
            selectinload(Workbook.activities)
            .selectinload(Activity.staff_responsible),
        )
    ).first()

    if not workbook:
        raise HTTPException(status_code=404, detail="Workbook not found")

    # Build the response
    response = {
        "workbook": {
            "id": str(workbook.id),
            "start_date": workbook.start_date.isoformat(),
            "end_date": workbook.end_date.isoformat(),
            "course_id": str(workbook.course_id),
            "course_lead_id": str(workbook.course_lead_id),
            "learning_platform_id": str(workbook.learning_platform_id),
        },
        "course": {
            "id": str(workbook.course.id),
            "course_code": workbook.course.course_code,
            "name": workbook.course.name,
        } if workbook.course else None,
        "course_lead": {
            "id": str(workbook.course_lead.id),
            "name": workbook.course_lead.name,
        } if workbook.course_lead else None,
        "learning_platform": {
            "id": str(workbook.learning_platform.id),
            "name": workbook.learning_platform.name,
        } if workbook.learning_platform else None,
        "activities": [],
    }

    # Process activities
    for activity in workbook.activities:
        activity_data = {
            "id": str(activity.id),
            "name": activity.name,
            "time_estimate_minutes": activity.time_estimate_minutes,
            "location": activity.location,
            "week_number": activity.week_number,
            "learning_activity": activity.learning_activity.name if activity.learning_activity else None,
            "learning_type": activity.learning_type.name if activity.learning_type else None,
            "task_status": activity.task_status.name if activity.task_status else None,
            "staff": [
                {
                    "id": str(user.id),
                    "name": user.name,
                } for user in activity.staff_responsible
            ],
        }
        response["activities"].append(activity_data)

    return response


# Other endpoints (if any)...

# Existing views for individual models with query parameters
@app.get("/users/")
def read_users(
    user_id: uuid.UUID | None = Query(None),
    session: Session = Depends(get_session),
) -> List[User]:
    if user_id:
        users = session.exec(select(User).where(User.id == user_id)).all()
        return users
    users = session.exec(select(User)).all()
    return users


@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    permissions_groups = session.exec(select(PermissionsGroup)).all()
    return permissions_groups


@app.get("/courses/")
def read_courses(
    course_id: uuid.UUID | None = Query(None),
    session: Session = Depends(get_session),
) -> List[Course]:
    if course_id:
        courses = session.exec(select(Course).where(Course.id == course_id)).all()
        return courses
    courses = session.exec(select(Course)).all()
    return courses


@app.get("/learning-platforms/")
def read_learning_platforms(
    platform_id: uuid.UUID | None = Query(None),
    session: Session = Depends(get_session),
) -> List[LearningPlatform]:
    if platform_id:
        platforms = session.exec(
            select(LearningPlatform).where(LearningPlatform.id == platform_id)
        ).all()
        return platforms
    learning_platforms = session.exec(select(LearningPlatform)).all()
    return learning_platforms


@app.get("/learning-activities/")
def read_learning_activities(
    session: Session = Depends(get_session),
) -> List[LearningActivity]:
    learning_activities = session.exec(select(LearningActivity)).all()
    return learning_activities


@app.get("/task-statuses/")
def read_task_statuses(session: Session = Depends(get_session)) -> List[TaskStatus]:
    task_statuses = session.exec(select(TaskStatus)).all()
    return task_statuses


@app.get("/learning-types/")
def read_learning_types(session: Session = Depends(get_session)) -> List[LearningType]:
    learning_types = session.exec(select(LearningType)).all()
    return learning_types


@app.get("/workbooks/")
def read_workbooks(
    workbook_id: uuid.UUID | None = Query(None),
    session: Session = Depends(get_session),
) -> List[Workbook]:
    if workbook_id:
        workbooks = session.exec(
            select(Workbook).where(Workbook.id == workbook_id)
        ).all()
        return workbooks
    workbooks = session.exec(select(Workbook)).all()
    return workbooks


@app.get("/weeks/")
def read_weeks(session: Session = Depends(get_session)) -> List[Week]:
    weeks = session.exec(select(Week)).all()
    return weeks


@app.get("/activities/")
def read_activities(
    workbook_id: uuid.UUID | None = Query(None),
    week_number: int | None = Query(None),
    session: Session = Depends(get_session),
) -> List[Activity]:
    query = select(Activity)
    if workbook_id:
        query = query.where(Activity.workbook_id == workbook_id)
    if week_number:
        query = query.where(Activity.week_number == week_number)
    activities = session.exec(query).all()
    return activities


# The old endpoint for fetching workbook activities
# You may choose to keep or remove this depending on your needs
@app.get("/workbook-activities/")
def read_workbook_activities(
    workbook_id: uuid.UUID = Query(...),
    session: Session = Depends(get_session),
):
    statement = (
        select(
            Activity,
            LearningActivity,
            LearningType,
            TaskStatus,
        )
        .join(LearningActivity, Activity.learning_activity_id == LearningActivity.id)
        .join(LearningType, Activity.learning_type_id == LearningType.id)
        .join(TaskStatus, Activity.task_status_id == TaskStatus.id)
        .where(Activity.workbook_id == workbook_id)
    )
    results = session.exec(statement).all()
    activities = []
    for activity, learning_activity, learning_type, task_status in results:
        activities.append(
            {
                "id": activity.id,
                "name": activity.name,
                "time_estimate_minutes": activity.time_estimate_minutes,
                "location": activity.location,
                "week_number": activity.week_number,
                "learning_activity": learning_activity.name,
                "learning_type": learning_type.name,
                "task_status": task_status.name,
            }
        )
    return activities
