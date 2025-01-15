from typing import Union, Annotated, AsyncGenerator, List, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select, Session
from pydantic import BaseModel
import uuid
from uuid import UUID
from datetime import date
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
    Location,
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
    return list(session.exec(select(User)).all())


@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    return list(session.exec(select(PermissionsGroup)).all())


@app.get("/courses/")
def read_courses(session: Session = Depends(get_session)) -> List[Course]:
    return list(session.exec(select(Course)).all())


@app.get("/learning-platforms/")
def read_learning_platforms(
    session: Session = Depends(get_session),
) -> List[LearningPlatform]:
    return list(session.exec(select(LearningPlatform)).all())


@app.get("/learning-activities/")
def read_learning_activities(
    session: Session = Depends(get_session),
    learning_platform_id: uuid.UUID | None = None,
) -> List[LearningActivity]:
    if not learning_platform_id:
        return list(session.exec(select(LearningActivity)).all())
    return list(
        session.exec(
            select(LearningActivity).where(
                LearningActivity.learning_platform_id == learning_platform_id
            )
        )
    )


@app.get("/task-statuses/")
def read_task_statuses(session: Session = Depends(get_session)) -> List[TaskStatus]:
    return list(session.exec(select(TaskStatus)).all())


@app.get("/learning-types/")
def read_learning_types(session: Session = Depends(get_session)) -> List[LearningType]:
    return list(session.exec(select(LearningType)).all())


@app.get("/workbooks/")
def read_workbooks(
    workbook_id: uuid.UUID | None = None,
    session: Session = Depends(get_session),
) -> List[Workbook]:
    if not workbook_id:
        return list(session.exec(select(Workbook)).all())
    return list(session.exec(select(Workbook).where(Workbook.id == workbook_id)))


@app.get("/weeks/")
def read_weeks(session: Session = Depends(get_session)) -> List[Week]:
    return list(session.exec(select(Week)).all())


@app.get("/graduate_attributes/")
def read_graduate_attributes(
    session: Session = Depends(get_session),
) -> List[GraduateAttribute]:
    graduate_attributes = list(session.exec(select(GraduateAttribute)).all())
    return graduate_attributes


@app.get("/locations/")
def read_locations(session: Session = Depends(get_session)) -> List[Location]:
    locations = list(session.exec(select(Location)).all())
    return locations


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
        location = session.exec(
            select(Location).where(Location.id == activity.location_id)
        ).first()
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
            "week_number": activity.week_number,
            "location": location.name if location else None,
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


# post request for creating a new workbook
class WorkbookCreateRequest(BaseModel):
    start_date: date
    end_date: date
    course_lead_id: UUID
    course_id: UUID
    learning_platform_id: UUID


# POST: create a new workbook
@app.post("/workbooks/")
def create_workbook(
    data: WorkbookCreateRequest, session: Session = Depends(get_session)
) -> Dict[str, UUID]:
    new_workbook = Workbook(
        start_date=data.start_date,
        end_date=data.end_date,
        course_lead_id=data.course_lead_id,
        course_id=data.course_id,
        learning_platform_id=data.learning_platform_id,
    )
    session.add(new_workbook)
    session.commit()
    # refresh the object to get the id
    session.refresh(new_workbook)
    return {"id": new_workbook.id}
