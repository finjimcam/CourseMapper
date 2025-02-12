from typing import Annotated, AsyncGenerator, List, Dict, Any, cast, TypeVar
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Response
from sqlmodel import Session, select, SQLModel
import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.frontends.implementations import SessionCookie, CookieParameters

from session import BaseVerifier, SessionData

from models.database import (
    create_db_and_tables,
    get_session,
)
from models.models_base import (
    User,
    PermissionsGroup,
    Week,
    WeekCreate,
    WeekDelete,
    WeekGraduateAttribute,
    WeekGraduateAttributeCreate,
    WeekGraduateAttributeDelete,
    Workbook,
    WorkbookCreate,
    WorkbookUpdate,
    Activity,
    ActivityCreate,
    ActivityUpdate,
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    Location,
    LearningType,
    ActivityStaff,
    ActivityStaffCreate,
    ActivityStaffDelete,
    ActivityStaffCreate,
    ActivityStaffDelete,
    GraduateAttribute,
    WorkbookContributor,
    WorkbookContributorCreate,
    WorkbookContributorDelete,
)

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://sh01-frontend.netlify.app",
    ],  # Frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

cookie_params = CookieParameters()

cookie = SessionCookie(
    cookie_name="cookie",
    identifier="general_verifier",
    auto_error=True,
    secret_key="DONOTUSE",
    cookie_params=cookie_params,
)

backend = InMemoryBackend[uuid.UUID, SessionData]()

verifier = BaseVerifier(
    identifier="general_verifier",
    auto_error=True,
    backend=backend,
    auth_http_exception=HTTPException(status_code=403, detail="Invalid session."),
)


T = TypeVar("T")  # Define a generic type variable


def unwrap(model: T | None) -> T:
    if model is None:
        raise HTTPException(status_code=500)
    return model


# Session requests
@app.post("/session/{name}")
async def create_session(
    username: str, response: Response, session: Session = Depends(get_session)
) -> dict[str, Any]:

    db_user = session.exec(select(User).where(User.name == username)).first()
    if db_user is None:
        raise HTTPException(status_code=422, detail=f"User with name {username} does not exist.")

    session_id = uuid.uuid4()
    data = SessionData(user_id=db_user.id)

    await backend.create(session_id, data)
    cookie.attach_to_response(response, session_id)

    return {"ok": True, "session_id": str(session_id)}


@app.get("/session/", dependencies=[Depends(cookie)])
def read_session(session_data: SessionData = Depends(verifier)) -> SessionData:
    return session_data


@app.delete("/session/")
async def delete_session(
    response: Response, session_id: uuid.UUID = Depends(cookie)
) -> dict[str, bool]:
    await backend.delete(session_id)
    cookie.delete_from_response(response)
    return {"ok": True}


# Delete requests for removing entries
@app.delete("/activity-staff/", dependencies=[Depends(cookie)])
def delete_activity_staff(
    activity_staff: ActivityStaffDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> dict[str, bool]:
    # check ActivityStaff validity
    try:
        activity_staff.check_primary_keys(session)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    db_activity_staff = unwrap(
        session.exec(
            select(ActivityStaff).where(
                (ActivityStaff.activity_id == activity_staff.activity_id)
                & (ActivityStaff.staff_id == activity_staff.staff_id)
            )
        ).first()
    )

    """
    Check user permissions: Staff members may remove themselves. Workbook owners and site admins
    may remove activity staff.
    """
    db_activity = unwrap(
        session.exec(select(Activity).where(Activity.id == db_activity_staff.activity_id)).first()
    )
    db_workbook = unwrap(
        session.exec(select(Workbook).where(Workbook.id == db_activity.workbook_id)).first()
    )
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if (
        session_data.user_id not in [db_activity_staff.staff_id, db_workbook_owner.id]
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    session.delete(db_activity_staff)
    session.commit()
    return {"ok": True}


@app.delete("/workbook-contributors/", dependencies=[Depends(cookie)])
def delete_workbook_contributor(
    workbook_contributor: WorkbookContributorDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> dict[str, bool]:
    # check WorkbookContributor validity
    try:
        workbook_contributor.check_primary_keys(session)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors may delete themselves. Workbook owners and site
    admins may delete contributors.
    """
    db_workbook_contributor = unwrap(
        session.exec(
            select(WorkbookContributor).where(
                (WorkbookContributor.workbook_id == workbook_contributor.workbook_id)
                & (WorkbookContributor.contributor_id == workbook_contributor.contributor_id)
            )
        ).first()
    )
    db_workbook = unwrap(
        session.exec(
            select(Workbook).where(Workbook.id == db_workbook_contributor.workbook_id)
        ).first()
    )
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if (
        session_data.user_id not in [db_workbook_contributor.contributor_id, db_workbook_owner.id]
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    session.delete(db_workbook_contributor)
    session.commit()
    return {"ok": True}


@app.delete("/weeks/", dependencies=[Depends(cookie)])
def delete_week(
    week: WeekDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> dict[str, bool]:
    # check Week validity
    try:
        week.check_primary_keys(session)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may delete
    weeks.
    """
    db_week = unwrap(
        session.exec(
            select(Week).where(
                (Week.workbook_id == week.workbook_id) & (Week.number == week.number)
            )
        ).first(),
    )
    db_workbook = unwrap(
        session.exec(select(Workbook).where(Workbook.id == db_week.workbook_id)).first(),
    )
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_workbook_contributor_ids = [
        unwrap(workbook_contributor).contributor_id
        for workbook_contributor in session.exec(
            select(WorkbookContributor).where(WorkbookContributor.workbook_id == db_workbook.id)
        ).all()
    ]
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if (
        session_data.user_id not in db_workbook_contributor_ids
        and session_data.user_id != db_workbook_owner.id
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    db_workbook.number_of_weeks -= 1
    session.add(db_workbook)
    session.delete(db_week)
    session.commit()
    # delete this week's activities
    for activity in db_week.activities:
        session.delete(activity)
    # loop through weeks of linked_workbook and update their numbers to maintain continuity
    for other_week in db_workbook.weeks:
        if other_week.number is None:
            continue
        if other_week.number > week.number:
            other_week.number -= 1
            session.add(other_week)
            # Link model WeekGraduateAttributes must be manually updated
            for week_graduate_attribute in session.exec(
                select(WeekGraduateAttribute).where(
                    (WeekGraduateAttribute.week_workbook_id == other_week.workbook_id)
                    & (WeekGraduateAttribute.week_number == other_week.number + 1)
                )
            ):
                week_graduate_attribute.week_number -= 1
                session.add(week_graduate_attribute)
            # Activities must be manually updated
            for activity in session.exec(
                select(Activity).where(
                    (Activity.workbook_id == other_week.workbook_id)
                    & (Activity.week_number == other_week.number + 1)
                )
            ):
                if activity.week_number is None:
                    continue
                activity.week_number -= 1
                session.add(activity)
    session.commit()
    return {"ok": True}


@app.delete("/week-graduate-attributes/", dependencies=[Depends(cookie)])
def delete_week_graduate_attribute(
    week_graduate_attribute: WeekGraduateAttributeDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> dict[str, bool]:
    # check WeekGraduateAttribute validity
    try:
        week_graduate_attribute.check_primary_keys(session)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owner, and site admins may delete week
    graduate attributes.
    """
    db_week_graduate_attribute = unwrap(
        session.exec(
            select(WeekGraduateAttribute).where(
                (
                    WeekGraduateAttribute.week_workbook_id
                    == week_graduate_attribute.week_workbook_id
                )
                & (WeekGraduateAttribute.week_number == week_graduate_attribute.week_number)
                & (
                    WeekGraduateAttribute.graduate_attribute_id
                    == week_graduate_attribute.graduate_attribute_id
                )
            )
        ).first()
    )
    db_workbook = unwrap(
        session.exec(
            select(Workbook).where(Workbook.id == db_week_graduate_attribute.week_workbook_id)
        ).first(),
    )
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_workbook_contributor_ids = [
        unwrap(workbook_contributor).contributor_id
        for workbook_contributor in session.exec(
            select(WorkbookContributor).where(WorkbookContributor.workbook_id == db_workbook.id)
        ).all()
    ]
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if (
        session_data.user_id not in db_workbook_contributor_ids
        and session_data.user_id != db_workbook_owner.id
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    session.delete(db_week_graduate_attribute)
    session.commit()
    return {"ok": True}


@app.delete("/workbooks/", dependencies=[Depends(cookie)])
def delete_workbook(
    workbook_id: uuid.UUID,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> dict[str, bool]:
    # check Workbook validity
    db_workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not db_workbook:
        raise HTTPException(status_code=422, detail=f"Workbook with id {workbook_id} not found.")

    """
    Check user permissions: Only a site admin may delet a workbook.
    """
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if db_user_permissions_group.name != "Admin":
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    weeks = session.exec(select(Week).where(Week.workbook_id == workbook_id)).all()
    for week in weeks:
        activities = session.exec(
            select(Activity).where(Activity.week_number == week.number)
        ).all()
        for activity in activities:
            session.delete(activity)
        session.delete(week)

    contributors = session.exec(
        select(WorkbookContributor).where(WorkbookContributor.workbook_id == workbook_id)
    ).all()
    for contributor in contributors:
        session.delete(contributor)

    # delete workbook
    session.delete(db_workbook)
    session.commit()
    return {"ok": True}


@app.delete("/activities/", dependencies=[Depends(cookie)])
def delete_activity(
    activity_id: uuid.UUID,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> dict[str, bool]:
    # check Activity validity
    db_activity = session.exec(select(Activity).where(Activity.id == activity_id)).first()
    if not db_activity:
        raise HTTPException(status_code=422, detail=f"Activity with id {db_activity} not found.")

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may delete
    activities from weeks.
    """
    db_workbook = unwrap(
        session.exec(select(Workbook).where(Workbook.id == db_activity.workbook_id)).first(),
    )
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_workbook_contributor_ids = [
        unwrap(workbook_contributor).contributor_id
        for workbook_contributor in session.exec(
            select(WorkbookContributor).where(WorkbookContributor.workbook_id == db_workbook.id)
        ).all()
    ]
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if (
        session_data.user_id not in db_workbook_contributor_ids
        and db_workbook_owner.id != session_data.user_id
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    # Loop through other activities in week to ensure numbering remains valid
    db_week = unwrap(
        session.exec(
            select(Week).where(
                (Week.number == db_activity.week_number)
                & (Week.workbook_id == db_activity.workbook_id)
            )
        ).first(),
    )
    for other_activity in db_week.activities:
        other_number = cast(int, other_activity.number)
        number = cast(int, db_activity.number)
        if other_number > number:
            other_number -= 1
            session.add(other_activity)
    # delete activity
    session.delete(db_activity)
    session.commit()
    return {"ok": True}


# Patch requests for editing entries
@app.patch("/activities/{activity_id}", dependencies=[Depends(cookie)])
def patch_activity(
    activity_id: uuid.UUID,
    activity_update: ActivityUpdate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
) -> Activity:
    # check Activity validity
    db_activity = session.exec(select(Activity).where(Activity.id == activity_id)).first()
    if not db_activity:
        raise HTTPException(status_code=422, detail="Activity not found")
    
    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may edit
    activities.
    """
    db_workbook = unwrap(
        session.exec(select(Workbook).where(Workbook.id == db_activity.workbook_id)).first(),
    )
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_workbook_contributor_ids = [
        unwrap(workbook_contributor).contributor_id
        for workbook_contributor in session.exec(
            select(WorkbookContributor).where(WorkbookContributor.workbook_id == db_workbook.id)
        ).all()
    ]
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if (
        session_data.user_id not in db_workbook_contributor_ids
        and db_workbook_owner.id != session_data.user_id
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    activity_dict = db_activity.model_dump()
    for k, v in activity_update.model_dump().items():
        if v is not None:
            activity_dict[k] = v
    activity_dict["session"] = session
    try:
        Activity.model_validate(activity_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Update data of the activity
    update_data = activity_update.model_dump(exclude_unset=True)  # Only pick the exist key
    for key, value in update_data.items():
        if key == "number":
            linked_week = cast(
                Week,
                session.exec(
                    select(Week).where(
                        (Week.number == db_activity.week_number)
                        & (Week.workbook_id == db_activity.workbook_id)
                    )
                ).first(),
            )  # exec is guaranteed by Activity model validation as week_number and workbook_id are primary foreign keys.
            # Validate new activity number. This cannot be done with base model validation, because of the
            # default value of 0.
            if value < 1 or value > len(linked_week.activities):
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid activity number: {value}. Activity number must be between 1 and {len(linked_week.activities)} inclusive.",
                )
            # Loop through other activities in week to ensure numbering remains valid
            for other_activity in linked_week.activities:
                other_number = cast(int, other_activity.number)
                number = cast(int, db_activity.number)
                if value > number:
                    if other_number > number and other_number <= value:
                        other_activity.number = other_number - 1
                        session.add(other_activity)
                else:
                    if other_number < number and other_number >= value:
                        other_activity.number = other_number + 1
                        session.add(other_activity)
            session.commit()
        if key == "number":
            linked_week = cast(
                Week,
                session.exec(
                    select(Week).where(
                        (Week.number == db_activity.week_number)
                        & (Week.workbook_id == db_activity.workbook_id)
                    )
                ).first(),
            )  # exec is guaranteed by Activity model validation as week_number and workbook_id are primary foreign keys.
            # Validate new activity number. This cannot be done with base model validation, because of the
            # default value of 0.
            if value < 1 or value > len(linked_week.activities):
                raise HTTPException(
                    status_code=422,
                    detail=f"Invalid activity number: {value}. Activity number must be between 1 and {len(linked_week.activities)} inclusive.",
                )
            # Loop through other activities in week to ensure numbering remains valid
            for other_activity in linked_week.activities:
                other_number = cast(int, other_activity.number)
                number = cast(int, db_activity.number)
                if value > number:
                    if other_number > number and other_number <= value:
                        other_activity.number = other_number - 1
                        session.add(other_activity)
                else:
                    if other_number < number and other_number >= value:
                        other_activity.number = other_number + 1
                        session.add(other_activity)
            session.commit()
        setattr(db_activity, key, value)

    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)  # Refresh data
    return db_activity


@app.patch("/workbooks/{workbook_id}")
def patch_workbook(
    workbook_id: uuid.UUID,
    workbook_update: WorkbookUpdate,
    session: Session = Depends(get_session),
) -> Workbook:

    db_workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not db_workbook:
        raise HTTPException(status_code=422, detail="Activity not found")
    workbook_dict = db_workbook.model_dump()
    for k, v in workbook_update.model_dump().items():
        if v is not None:
            workbook_dict[k] = v
    workbook_dict["session"] = session
    try:
        Workbook.model_validate(workbook_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Update data of the workbook
    update_data = workbook_update.model_dump(exclude_unset=True)  # Only pick the exist key
    for key, value in update_data.items():
        setattr(db_workbook, key, value)

    session.add(db_workbook)
    session.commit()
    session.refresh(db_workbook)  # Refresh data

    return db_workbook


# Post requests for creating new entries
@app.post("/activity-staff/", response_model=ActivityStaff)
def create_activity_staff(
    activity_staff: ActivityStaffCreate,
    session: Session = Depends(get_session),
) -> ActivityStaff:
    activity_staff_dict = activity_staff.model_dump()
    activity_staff_dict["session"] = session
    try:
        db_activity_staff = ActivityStaff.model_validate(activity_staff_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    session.add(db_activity_staff)
    session.commit()
    session.refresh(db_activity_staff)
    return db_activity_staff


@app.post("/activities/", response_model=Activity)
def create_activity(activity: ActivityCreate, session: Session = Depends(get_session)) -> Activity:
    activity_dict = activity.model_dump()
    activity_dict["session"] = session
    try:
        db_activity = Activity.model_validate(activity_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    linked_week = cast(
        Week,
        session.exec(
            select(Week).where(
                (Week.number == db_activity.week_number)
                & (Week.workbook_id == db_activity.workbook_id)
            )
        ).first(),
    )  # exec is guaranteed by Activity model validation as week_number and workbook_id are primary foreign keys.
    db_activity.number = len(linked_week.activities) + 1
    linked_week = cast(
        Week,
        session.exec(
            select(Week).where(
                (Week.number == db_activity.week_number)
                & (Week.workbook_id == db_activity.workbook_id)
            )
        ).first(),
    )  # exec is guaranteed by Activity model validation as week_number and workbook_id are primary foreign keys.
    db_activity.number = len(linked_week.activities) + 1
    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)
    return db_activity


@app.post("/workbooks/", response_model=Workbook)
def create_workbook(workbook: WorkbookCreate, session: Session = Depends(get_session)) -> Workbook:
    workbook_dict = workbook.model_dump()
    workbook_dict["session"] = session
    try:
        db_workbook = Workbook.model_validate(workbook_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    session.add(db_workbook)
    session.commit()
    session.refresh(db_workbook)
    return db_workbook


@app.post("/weeks/", response_model=Week)
def create_week(week: WeekCreate, session: Session = Depends(get_session)) -> Week:
    week_dict = week.model_dump()
    week_dict["session"] = session
    try:
        db_week = Week.model_validate(week_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    linked_workbook = cast(
        Workbook,
        session.exec(select(Workbook).where(Workbook.id == db_week.workbook_id)).first(),
    )  # exec is guaranteed by Week model validation as workbook_id is a primary foreign key.
    db_week.number = linked_workbook.number_of_weeks + 1
    linked_workbook.number_of_weeks += 1
    session.add(db_week)
    session.add(linked_workbook)
    session.commit()
    session.refresh(db_week)
    return db_week


@app.post("/workbooks/{workbook_id}/duplicate", response_model=Workbook)
def duplicate_workbook(
    workbook_id: uuid.UUID, user_id: uuid.UUID, session: Session = Depends(get_session)
) -> Workbook:
    db_user = session.exec(select(User).where(User.id == user_id)).first()
    # check if user exists
    if not db_user:
        raise HTTPException(status_code=422, detail=f"User with id {db_user} not found.")

    db_workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    # check if workbook exists
    if not db_workbook:
        raise HTTPException(status_code=422, detail=f"Workbook with id {db_workbook} not found.")

    try:
        # get original workbook
        original_workbook = session.exec(
            select(Workbook).where(Workbook.id == workbook_id)
        ).first()
        if not original_workbook:
            raise HTTPException(status_code=404, detail="Workbook not found")

        # Copy workbook
        new_workbook = Workbook(
            start_date=original_workbook.start_date,
            end_date=original_workbook.end_date,
            course_name=original_workbook.course_name,
            course_lead_id=user_id,
            learning_platform_id=original_workbook.learning_platform_id,
            number_of_weeks=original_workbook.number_of_weeks,
        )
        session.add(new_workbook)
        session.commit()
        session.refresh(new_workbook)

        # Copy weeks
        original_weeks = session.exec(select(Week).where(Week.workbook_id == workbook_id)).all()

        for original_week in original_weeks:
            new_week = Week(workbook_id=new_workbook.id, number=original_week.number)
            session.add(new_week)
            session.commit()
            session.refresh(new_week)

        # Copy activities and ActivityStaffs
        original_activities = session.exec(
            select(Activity).where(Activity.workbook_id == workbook_id)
        ).all()
        # Copy activities
        for original_activity in original_activities:
            new_activity = Activity(
                workbook_id=new_workbook.id,
                week_number=original_activity.week_number,
                name=original_activity.name,
                number=original_activity.number,
                time_estimate_minutes=original_activity.time_estimate_minutes,
                location_id=original_activity.location_id,
                learning_activity_id=original_activity.learning_activity_id,
                learning_type_id=original_activity.learning_type_id,
                task_status_id=original_activity.task_status_id,
            )
            session.add(new_activity)

            # Copy ActivityStaffs
            original_ActivityStaffs = session.exec(
                select(ActivityStaff).where(ActivityStaff.activity_id == original_activity.id)
            ).all()
            for original_ActivityStaff in original_ActivityStaffs:
                new_ActivityStaff = ActivityStaff(
                    staff_id=original_ActivityStaff.staff_id,
                    activity_id=new_activity.id,
                )
                session.add(new_ActivityStaff)

        # Copy workbook contributors
        original_contributors = session.exec(
            select(WorkbookContributor).where(WorkbookContributor.workbook_id == workbook_id)
        ).all()
        for contributor in original_contributors:
            new_contributor = WorkbookContributor(
                contributor_id=contributor.contributor_id, workbook_id=new_workbook.id
            )
            session.add(new_contributor)

        session.commit()
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return new_workbook


@app.post("/workbook-contributors/", response_model=WorkbookContributor)
def create_workbook_contributor(
    workbook_contributor: WorkbookContributorCreate,
    session: Session = Depends(get_session),
) -> WorkbookContributor:
    workbook_contributor_dict = workbook_contributor.model_dump()
    workbook_contributor_dict["session"] = session
    try:
        db_workbook_contributor = WorkbookContributor.model_validate(workbook_contributor_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    session.add(db_workbook_contributor)
    session.commit()
    session.refresh(db_workbook_contributor)
    return db_workbook_contributor


@app.post("/week-graduate-attributes/", response_model=WeekGraduateAttribute)
def create_week_graduate_attribute(
    week_graduate_attribute: WeekGraduateAttributeCreate,
    session: Session = Depends(get_session),
) -> WeekGraduateAttribute:
    week_graduate_attribute_dict = week_graduate_attribute.model_dump()
    week_graduate_attribute_dict["session"] = session
    try:
        db_week_graduate_attribute = WeekGraduateAttribute.model_validate(
            week_graduate_attribute_dict
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    session.add(db_week_graduate_attribute)
    session.commit()
    session.refresh(db_week_graduate_attribute)
    return db_week_graduate_attribute


@app.get("/activity-staff/")
def read_actvity_straff(
    session: Session = Depends(get_session),
    staff_id: uuid.UUID | None = None,
    activity_id: uuid.UUID | None = None,
) -> List[ActivityStaff]:
    if staff_id is not None:
        return list(
            session.exec(select(ActivityStaff).where(ActivityStaff.staff_id == staff_id)).all()
        )
    elif activity_id is not None:
        return list(
            session.exec(
                select(ActivityStaff).where(ActivityStaff.activity_id == activity_id)
            ).all()
        )
    return list(session.exec(select(ActivityStaff)).all())


@app.get("/week-graduate-attributes/")
def read_week_graduate_attributes(
    session: Session = Depends(get_session),
    week_workbook_id: uuid.UUID | None = None,
    week_number: int | None = None,
    graduate_attribute_id: uuid.UUID | None = None,
) -> List[WeekGraduateAttribute]:
    week = week_workbook_id and week_number is not None
    if not week and not graduate_attribute_id:
        return list(session.exec(select(WeekGraduateAttribute)).all())
    if not week:
        return list(
            session.exec(
                select(WeekGraduateAttribute).where(
                    WeekGraduateAttribute.graduate_attribute_id == graduate_attribute_id
                )
            )
        )
    if not graduate_attribute_id:
        return list(
            session.exec(
                select(WeekGraduateAttribute).where(
                    (WeekGraduateAttribute.week_workbook_id == week_workbook_id)
                    & (WeekGraduateAttribute.week_number == week_number)
                )
            )
        )
    return list(
        session.exec(
            select(WeekGraduateAttribute).where(
                (WeekGraduateAttribute.week_workbook_id == week_workbook_id)
                & (WeekGraduateAttribute.week_number == week_number)
                & (WeekGraduateAttribute.graduate_attribute_id == graduate_attribute_id)
            )
        )
    )


@app.get("/workbook-contributors/")
def read_workbook_contributors(
    session: Session = Depends(get_session),
    contributor_id: uuid.UUID | None = None,
    workbook_id: uuid.UUID | None = None,
) -> List[WorkbookContributor]:
    if not contributor_id and not workbook_id:
        return list(session.exec(select(WorkbookContributor)).all())
    if not contributor_id:
        return list(
            session.exec(
                select(WorkbookContributor).where(WorkbookContributor.workbook_id == workbook_id)
            )
        )
    if not workbook_id:
        return list(
            session.exec(
                select(WorkbookContributor).where(
                    WorkbookContributor.contributor_id == contributor_id
                )
            )
        )
    return list(
        session.exec(
            select(WorkbookContributor).where(
                (WorkbookContributor.workbook_id == workbook_id)
                & (WorkbookContributor.contributor_id == contributor_id)
            )
        )
    )


@app.get("/users/")
def read_users(session: Session = Depends(get_session)) -> List[User]:
    return list(session.exec(select(User)).all())


@app.get("/permissions-groups/")
def read_permissions_groups(
    session: Session = Depends(get_session),
) -> List[PermissionsGroup]:
    return list(session.exec(select(PermissionsGroup)).all())


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
) -> List[Dict[str, Any]]:
    if not workbook_id:
        sqlmodel_workbooks: List[Workbook] = list(session.exec(select(Workbook)).all())
        workbooks: List[Dict[str, Any]] = []

        for workbook in sqlmodel_workbooks:
            wb = dict(workbook)
            wb["course_lead"] = list(
                session.exec(select(User).where(User.id == workbook.course_lead_id))
            )[0].name
            wb["learning_platform"] = list(
                session.exec(
                    select(LearningPlatform).where(
                        LearningPlatform.id == workbook.learning_platform_id
                    )
                )
            )[0].name
            workbooks.append(wb)

        return workbooks

    return [
        dict(workbook)
        for workbook in session.exec(select(Workbook).where(Workbook.id == workbook_id))
    ]


@app.get("/weeks/")
def read_weeks(
    workbook_id: uuid.UUID | None = None,
    week_number: int | None = None,
    session: Session = Depends(get_session),
) -> List[Week]:
    if not workbook_id:
        return list(session.exec(select(Week)).all())
    if not week_number:
        return list(session.exec(select(Week).where(Week.workbook_id == workbook_id)))
    return list(
        session.exec(
            select(Week).where(Week.workbook_id == workbook_id, Week.number == week_number)
        )
    )


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
        return list(session.exec(select(Activity).where(Activity.workbook_id == workbook_id)))
    return list(
        session.exec(
            select(Activity).where(
                (Activity.workbook_id == workbook_id) & (Activity.week_number == week_number)
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
    course_lead = session.exec(select(User).where(User.id == workbook.course_lead_id)).first()
    learning_platform = session.exec(
        select(LearningPlatform).where(LearningPlatform.id == workbook.learning_platform_id)
    ).first()
    activities = list(session.exec(select(Activity).where(Activity.workbook_id == workbook_id)))

    # Build response
    response: Dict[str, Any] = {
        "workbook": {
            "id": str(workbook.id),
            "start_date": workbook.start_date.isoformat(),
            "end_date": workbook.end_date.isoformat(),
            "course_name": workbook.course_name,
            "course_lead_id": str(workbook.course_lead_id),
            "learning_platform_id": str(workbook.learning_platform_id),
        },
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
            select(LearningActivity).where(LearningActivity.id == activity.learning_activity_id)
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
                select(User).join(ActivityStaff).where(ActivityStaff.activity_id == activity.id)
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
