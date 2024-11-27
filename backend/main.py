from typing import Union, Annotated, AsyncGenerator, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
import uuid
from fastapi.middleware.cors import CORSMiddleware

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
    ActivityStaff,
    GraduateAttribute,
)

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
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


# Views for individual models for testing purposes
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
def read_workbooks(
    workbook_id: uuid.UUID | None = None,
    session: Session = Depends(get_session),
) -> List[dict]:
    if not workbook_id:
        sqlmodel_workbooks: List[Workbook] = list(session.exec(select(Workbook)).all())
        workbooks: List[dict] = []

        for workbook in sqlmodel_workbooks:
            wb: dict = dict(workbook)
            wb["course_name"] = list(session.exec(select(Course).where(Course.id == workbook.course_id)))[0].name
            wb["course_lead"] = list(session.exec(select(User).where(User.id == workbook.course_lead_id)))[0].name
            wb["learning_platform"] = list(session.exec(select(LearningPlatform).where(LearningPlatform.id == workbook.learning_platform_id)))[0].name
            workbooks.append(wb)

        return workbooks
            
    return [dict(workbook) for workbook in session.exec(select(Workbook).where(Workbook.id == workbook_id))]


@app.get("/weeks/")
def read_weeks(session: Session = Depends(get_session)) -> List[Week]:
    weeks = list(session.exec(select(Week)).all())
    return weeks


@app.get("/graduate_attributes/")
def read_graduate_attributes(
    session: Session = Depends(get_session),
) -> List[GraduateAttribute]:
    graduate_attributes = list(session.exec(select(GraduateAttribute)).all())
    return graduate_attributes


@app.get("/activities/")
def read_activities(
    workbook_id: uuid.UUID | None = None,
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
                (Activity.workbook_id == workbook_id)
                & (Activity.week_number == week_number)
            )
        )
    )


# New endpoint to fetch all workbook details and related data
@app.get("/workbooks/{workbook_id}/details")
def get_workbook_details(
    workbook_id: uuid.UUID,
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    # Fetch workbook
    workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not workbook:
        raise HTTPException(status_code=404, detail="Workbook not found")

    # Fetch related data
    course = session.exec(select(Course).where(Course.id == workbook.course_id)).first()
    course_lead = session.exec(
        select(User).where(User.id == workbook.course_lead_id)
    ).first()
    learning_platform = session.exec(
        select(LearningPlatform).where(
            LearningPlatform.id == workbook.learning_platform_id
        )
    ).first()
    activities = list(
        session.exec(select(Activity).where(Activity.workbook_id == workbook_id))
    )

    # Build response
    response: Dict[str, Any] = {
        "workbook": {
            "id": str(workbook.id),
            "start_date": workbook.start_date.isoformat(),
            "end_date": workbook.end_date.isoformat(),
            "course_id": str(workbook.course_id),
            "course_lead_id": str(workbook.course_lead_id),
            "learning_platform_id": str(workbook.learning_platform_id),
        },
        "course": (
            {
                "id": str(course.id),
                "course_code": course.course_code,
                "name": course.name,
            }
            if course
            else None
        ),
        "course_lead": (
            {
                "id": str(course_lead.id),
                "name": course_lead.name,
            }
            if course_lead
            else None
        ),
        "learning_platform": (
            {
                "id": str(learning_platform.id),
                "name": learning_platform.name,
            }
            if learning_platform
            else None
        ),
        "activities": [],
    }

    # Process activities
    activities_list: List[Dict[str, Any]] = []
    for activity in activities:
        # Fetch related data for each activity
        learning_activity = session.exec(
            select(LearningActivity).where(
                LearningActivity.id == activity.learning_activity_id
            )
        ).first()
        learning_type = session.exec(
            select(LearningType).where(LearningType.id == activity.learning_type_id)
        ).first()
        task_status = session.exec(
            select(TaskStatus).where(TaskStatus.id == activity.task_status_id)
        ).first()

        # Get staff using the link model
        staff = list(
            session.exec(
                select(User)
                .join(ActivityStaff)
                .where(ActivityStaff.activity_id == activity.id)
            )
        )

        activity_data = {
            "id": str(activity.id),
            "name": activity.name,
            "time_estimate_minutes": activity.time_estimate_minutes,
            "location": activity.location,
            "week_number": activity.week_number,
            "learning_activity": learning_activity.name if learning_activity else None,
            "learning_type": learning_type.name if learning_type else None,
            "task_status": task_status.name if task_status else None,
            "staff": [
                {
                    "id": str(user.id),
                    "name": user.name,
                }
                for user in staff
            ],
        }
        activities_list.append(activity_data)
    response["activities"] = activities_list

    return response
