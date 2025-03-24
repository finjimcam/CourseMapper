"""
Source code for LISU CCM @UofG
Copyright (C) 2025 Maxine Armstrong, Ibrahim Asghar, Finlay Cameron, Colin Nardo, Rachel Horton, Qikai Zhou

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program at /LICENSE.md. If not, see <https://www.gnu.org/licenses/>.

__-----------------------------------------------------------------------------------__

This module defines the actual API using functionality from the other files in /backend/.

The hooks defined include delete, fetch, patch, and post requests. User authentication
is also implemented in this file, as it is tightly coupled with the specific API hook
being called.
"""

from typing import Annotated, AsyncGenerator, List, Dict, Any, cast, TypeVar
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.frontends.implementations import SessionCookie, CookieParameters
from fastapi.responses import StreamingResponse
import pandas as pd
import io

from session import BaseVerifier, SessionData
from sqlmodel import Session, select
import re
import uuid
import datetime
from helpers import add_workbook_details

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
    Area,
    Schools,
)

SessionDep = Annotated[Session, Depends(get_session)]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """Handles startup and shutdown events for the FastAPI application."""
    create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://sh01-frontend.netlify.app",
    ],  # Frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

cookie_params = CookieParameters(max_age=3600, secure=True, samesite="strict", path="/")  # 1 hour

cookie = SessionCookie(
    cookie_name="session",
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
    """A helper function to handle None by raising an error. Similar to rust's unwrap()."""
    if model is None:
        raise HTTPException(status_code=500)
    return model


# Session requests
@app.post("/api/session/{username}")
async def create_session(
    username: str, response: Response, session: Session = Depends(get_session)
) -> dict[str, Any]:
    """Creates a session for the given authenticated user.

    Currently, authentication isn't handled. This will be integrated with AZURE AD when
    we are given access to the service. The session is created as a cookie on the
    host's machine.

    Returns:
        A dict containing the session ID and "ok": True.

    Raises:
        HTTPException(422): if login attempt fails due to database
        HTTPException(500): if login attempt fails for any other reason
    """

    db_user = session.exec(select(User).where(User.name == username)).first()
    if db_user is None:
        raise HTTPException(status_code=422, detail=f"User with name {username} does not exist.")

    session_id = uuid.uuid4()
    data = SessionData(user_id=db_user.id)

    await backend.create(session_id, data)
    cookie.attach_to_response(response, session_id)

    return {"ok": True, "session_id": str(session_id)}


@app.get("/api/session/", dependencies=[Depends(cookie)])
async def read_session(session_data: SessionData = Depends(verifier)) -> SessionData:
    """Return the session data of an authenticated user.

    Args:
        session_data: The session object stored by the browser as a cookie.

    Returns:
        The sessiondata object, which contains a single field user_id: UUID.

    Raises:
        HTTPException(403): If no valid session is provided as a cookie
        HTTPException(500): If attempt fails for any other reason
    """
    return session_data


@app.delete("/api/session/")
async def delete_session(
    response: Response, session_id: uuid.UUID = Depends(cookie)
) -> dict[str, bool]:
    """Deletes the session data of an authenticated user.

    Useful for logging out to ensure that the login data isn't stored in the user's
    browser, enabling other users of their computer to access their session.

    Args:
        session_id: The session object stored by the browser as a cookie.

    Returns:
        A dict {"ok": True} on successful execution.

    Raises:
        HTTPException(403): If no valid session is provided as a cookie.
        HTTPException(500): If attempt fails for any other reason.
    """
    await backend.delete(session_id)
    cookie.delete_from_response(response)
    return {"ok": True}


# Delete requests for removing entries
@app.delete("/api/activity-staff/", dependencies=[Depends(cookie)])
def delete_activity_staff(
    activity_staff: ActivityStaffDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> dict[str, bool]:
    """Deletes an activity-staff row from the database.

    The activity-staff table is a link table between users and activities, and
    represents the users responsible for the activity as its staff.

    Args:
        activity_staff: A model containing the primary keys of the row to delete.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        A dict {"ok": True} on successful execution, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

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
    Check user permissions: Staff members may remove themselves. Workbook owners and contributors
     and site admins may remove activity staff.
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
        session_data.user_id not in [db_activity_staff.staff_id, db_workbook_owner.id]
        and session_data.user_id not in db_workbook_contributor_ids
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    if peek:
        return {"ok": True}

    session.delete(db_activity_staff)
    session.commit()
    return {"ok": True}


@app.delete("/api/workbook-contributors/", dependencies=[Depends(cookie)])
def delete_workbook_contributor(
    workbook_contributor: WorkbookContributorDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> dict[str, bool]:
    """Deletes a workbook-contributor row from the database.

    The workbook-contributor table is a link table between users and workbooks, and
    represents the users who can contribute to the workbook by editing it.

    Args:
        workbook_contributor: A model containing the primary keys of the row to delete.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        A dict {"ok": True} on successful execution, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

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

    if peek:
        return {"ok": True}

    session.delete(db_workbook_contributor)
    session.commit()
    return {"ok": True}


@app.delete("/api/weeks/", dependencies=[Depends(cookie)])
def delete_week(
    week: WeekDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> dict[str, bool]:
    """Deletes a week row from the database.

    Deleting a week may also renumber other weeks in the same workbook in order to
    maintaing contiguous week numbering in the range [1..n]. Deleting a week also
    deletes all activities within that week, and all activity-staff relationships
    pointing to those deleted activities.

    Args:
        week: A model containing the primary keys of the row to delete.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        A dict {"ok": True} on successful execution, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

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

    if peek:
        return {"ok": True}

    db_workbook.number_of_weeks -= 1
    # save all other activities
    erroneously_deleted_activities = list(
        session.exec(
            select(Activity).where(
                (Activity.week_number == db_week.number) & (Activity.workbook_id != db_workbook.id)
            )
        ).all()
    )
    # renumber to sentry
    for activity in erroneously_deleted_activities:
        activity.week_number = -1
        session.add(activity)
        session.commit()
        session.refresh(activity)
    # delete week
    session.add(db_workbook)
    session.delete(db_week)
    session.commit()
    # delete related activities
    for activity in db_week.activities:
        session.delete(activity)
    session.commit()
    # recreate activities
    for activity in erroneously_deleted_activities:
        activity.week_number = db_week.number
        session.add(activity)
        session.commit()
        session.refresh(activity)
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


@app.delete("/api/week-graduate-attributes/", dependencies=[Depends(cookie)])
def delete_week_graduate_attribute(
    week_graduate_attribute: WeekGraduateAttributeDelete,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> dict[str, bool]:
    """Deletes a week-graduate-attribute row from the database.

    The week-graduate-attribute table is a link table between weeks and graduate
    attributes, and represents the graduate attributes assigned to a particular week.

    Args:
        week_graduate_attribute: A model containing the primary keys of the row to
            delete.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        A dict {"ok": True} on successful execution, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check WeekGraduateAttribute validity
    try:
        week_graduate_attribute.check_primary_keys(session)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may delete week
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

    if peek:
        return {"ok": True}

    session.delete(db_week_graduate_attribute)
    session.commit()
    return {"ok": True}


@app.delete("/api/workbooks/", dependencies=[Depends(cookie)])
def delete_workbook(
    workbook_id: uuid.UUID,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> dict[str, bool]:
    """Deletes a workbook row from the database.

    Deleting a workbook also deletes all workbook-contributors linked to that workbook,
    all weeks within that workbook, all activities within those weeks, and all
    activity-staff relationships pointing to those deleted activities.

    Args:
        workbook: A model containing the primary keys of the row to delete.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        A dict {"ok": True} on successful execution, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check Workbook validity
    db_workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not db_workbook:
        raise HTTPException(status_code=422, detail=f"Workbook with id {workbook_id} not found.")

    """
    Check user permissions: Only a site admin may delete a workbook.
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

    if peek:
        return {"ok": True}

    session.delete(db_workbook)
    session.commit()
    return {"ok": True}


@app.delete("/api/activities/", dependencies=[Depends(cookie)])
def delete_activity(
    activity_id: uuid.UUID,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> dict[str, bool]:
    """Deletes an activity row from the database.

    Deleting an activity may also renumber other activities in the same week in order
    to maintain contiguous activity numbering in the range [1..n]. It will also delete
    all related activity_staff.

    Args:
        activity: A model containing the primary keys of the row to delete.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        A dict {"ok": True} on successful execution, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

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

    if peek:
        return {"ok": True}

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
@app.patch("/api/activities/{activity_id}", dependencies=[Depends(cookie)])
def patch_activity(
    activity_id: uuid.UUID,
    activity_update: ActivityUpdate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Activity | None:
    """Edits an activity row in the database.

    If the number of the activity is updated, then the numbers of all other activities
    in that week are updated in order to maintain a contiguous numbering from [1..n].
    For example, if activities are A:1, B:2, C:3, D:4, then reumbering D:2 would result
    in the following order: A:1 D:2 B:3 C:4.

    Args:
        activity_id: The UUID of the activity being edited.
        activity_update: The data of the activity update request.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully edited activity, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

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

    if peek:
        return None

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


@app.patch("/api/workbooks/{workbook_id}", dependencies=[Depends(cookie)])
def patch_workbook(
    workbook_id: uuid.UUID,
    workbook_update: WorkbookUpdate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Workbook | None:
    """Edits a workbook row in the database.

    Args:
        workbook_id: The UUID of the workbook being edited.
        workbook_update: The data of the workbook update request.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully edited workbook, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check Workbook validity
    db_workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not db_workbook:
        raise HTTPException(status_code=422, detail="Activity not found")

    """
    Check user permissions: Workbook owners and site admins may edit workbooks.
    """
    db_workbook_owner = unwrap(
        session.exec(select(User).where(User.id == db_workbook.course_lead_id)).first()
    )
    db_user = unwrap(session.exec(select(User).where(User.id == session_data.user_id)).first())
    db_user_permissions_group = unwrap(
        session.exec(
            select(PermissionsGroup).where(PermissionsGroup.id == db_user.permissions_group_id)
        ).first()
    )
    if db_workbook_owner.id != session_data.user_id and db_user_permissions_group.name != "Admin":
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    if peek:
        return None

    workbook_dict = db_workbook.model_dump()
    for k, v in workbook_update.model_dump().items():
        if v is not None or k == "school_id":
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
@app.post("/api/activity-staff/", response_model=ActivityStaff, dependencies=[Depends(cookie)])
def create_activity_staff(
    activity_staff: ActivityStaffCreate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> ActivityStaff | None:
    """Adds an activity-staff row to the database.

    The activity-staff table is a link table between users and activities, and
    represents the users responsible for the activity as its staff.

    Args:
        activity_staff: The data of the new activity staff.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created activity-staff, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check ActivityStaff validity
    activity_staff_dict = activity_staff.model_dump()
    activity_staff_dict["session"] = session
    try:
        db_activity_staff = ActivityStaff.model_validate(activity_staff_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may add
    activity staff to a workbook.
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

    if peek:
        return None

    session.add(db_activity_staff)
    session.commit()
    session.refresh(db_activity_staff)
    return db_activity_staff


@app.post("/api/activities/", response_model=Activity, dependencies=[Depends(cookie)])
def create_activity(
    activity: ActivityCreate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Activity | None:
    """Adds an activity row to the database.

    The activity is automatically given the number n+1 where there exist n activities
    in its week.

    Args:
        activity: The data of the new activity.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created activity, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check Activity validity
    activity_dict = activity.model_dump()
    activity_dict["session"] = session
    try:
        db_activity = Activity.model_validate(activity_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may add
    activity staff to a workbook.
    """
    db_workbook = unwrap(
        session.exec(select(Workbook).where(Workbook.id == db_activity.workbook_id)).first()
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

    if peek:
        return None

    linked_week = unwrap(
        session.exec(
            select(Week).where(
                (Week.number == db_activity.week_number)
                & (Week.workbook_id == db_activity.workbook_id)
            )
        ).first(),
    )
    db_activity.number = len(linked_week.activities) + 1
    linked_week = unwrap(
        session.exec(
            select(Week).where(
                (Week.number == db_activity.week_number)
                & (Week.workbook_id == db_activity.workbook_id)
            )
        ).first(),
    )
    db_activity.number = len(linked_week.activities) + 1
    session.add(db_activity)
    session.commit()
    session.refresh(db_activity)
    return db_activity


@app.post("/api/workbooks/", response_model=Workbook, dependencies=[Depends(cookie)])
def create_workbook(
    workbook: WorkbookCreate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Workbook | None:
    """Adds a workbook row to the database.

    Args:
        workbook: The data of the new workbook.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created workbook, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    workbook_dict = workbook.model_dump()
    workbook_dict["course_lead_id"] = session_data.user_id
    workbook_dict["session"] = session

    try:
        db_workbook = Workbook.model_validate(workbook_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if peek:
        return None

    session.add(db_workbook)
    session.commit()
    session.refresh(db_workbook)
    return db_workbook


@app.post("/api/weeks/", response_model=Week, dependencies=[Depends(cookie)])
def create_week(
    week: WeekCreate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Week | None:
    """Adds a week row to the database.

    The activity is automatically given the number n+1 where there exist n weeks
    in its workbook.

    Args:
        week: The data of the new week.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created week, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check Week validity
    week_dict = week.model_dump()
    week_dict["session"] = session
    try:
        db_week = Week.model_validate(week_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may create
    weeks.
    """
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
        and db_workbook_owner.id != session_data.user_id
        and db_user_permissions_group.name != "Admin"
    ):
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    if peek:
        return None

    db_week.number = db_workbook.number_of_weeks + 1
    db_workbook.number_of_weeks += 1
    session.add(db_week)
    session.add(db_workbook)
    session.commit()
    session.refresh(db_week)
    return db_week


@app.post(
    "/api/workbooks/{workbook_id}/duplicate",
    response_model=Workbook,
    dependencies=[Depends(cookie)],
)
def duplicate_workbook(
    workbook_id: uuid.UUID,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Workbook | None:
    """Creates a copy of a given workbook in the database.

    The owner of the copy will be the user who calls this request, determined by the
    state in the session cookie.
    All link models, weeks, and activities are also copied: This is a deepcopy.

    Args:
        workbook_id: The id of the workbook to copy.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created workbook, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    db_user = session.exec(select(User).where(User.id == session_data.user_id)).first()
    # check if user exists
    if not db_user:
        raise HTTPException(status_code=422, detail=f"User with id {db_user} not found.")

    db_workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    # check if workbook exists
    if not db_workbook:
        raise HTTPException(status_code=422, detail=f"Workbook with id {db_workbook} not found.")

    if peek:
        return None

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
            course_name=str(original_workbook.course_name) + " - COPY",
            course_lead_id=session_data.user_id,
            learning_platform_id=original_workbook.learning_platform_id,
            number_of_weeks=original_workbook.number_of_weeks,
            area_id=original_workbook.area_id,
            school_id=original_workbook.school_id,
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

        original_week_grad_attrs = (
            session.exec(
                select(WeekGraduateAttribute).where(
                    WeekGraduateAttribute.week_workbook_id == workbook_id
                )
            ).all()
            or []
        )

        for grad_attr in original_week_grad_attrs:
            new_grad_attr = WeekGraduateAttribute(
                week_workbook_id=new_workbook.id,
                week_number=grad_attr.week_number,
                graduate_attribute_id=grad_attr.graduate_attribute_id,
            )
            session.add(new_grad_attr)

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

    session.refresh(new_workbook)
    return new_workbook


@app.post(
    "/api/workbook-contributors/",
    response_model=WorkbookContributor,
    dependencies=[Depends(cookie)],
)
def create_workbook_contributor(
    workbook_contributor: WorkbookContributorCreate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> WorkbookContributor | None:
    """Creates a workbook-contributor in the database.

    The workbook-contributor table is a link table between users and workbooks, and
    represents the users who can contribute to the workbook by editing it.

    Args:
        workbook_contributor: The data of the new workbook-contributor link.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created workbook-contributor, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    workbook_contributor_dict = workbook_contributor.model_dump()
    workbook_contributor_dict["session"] = session
    try:
        db_workbook_contributor = WorkbookContributor.model_validate(workbook_contributor_dict)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook owners and site admins may add contributors.
    """
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
    if session_data.user_id != db_workbook_owner.id and db_user_permissions_group.name != "Admin":
        raise HTTPException(status_code=403, detail="Permission denied.")  # deliberately obscure

    if peek:
        return None

    session.add(db_workbook_contributor)
    session.commit()
    session.refresh(db_workbook_contributor)
    return db_workbook_contributor


@app.post(
    "/api/week-graduate-attributes/",
    response_model=WeekGraduateAttribute,
    dependencies=[Depends(cookie)],
)
def create_week_graduate_attribute(
    week_graduate_attribute: WeekGraduateAttributeCreate,
    session_data: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> WeekGraduateAttribute | None:
    """Creates a week-graduate-attribute in the database.

    The week-graduate-attribute table is a link table between weeks and graduate
    attributes, and represents the graduate attributes assigned to a particular week.

    Args:
        week_graduate_attribute: The data of the new week-graduate-attribute link.
        session_data: The session object stored by the browser as a cookie.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The successfully created week-graduate-attribute, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    # check WeekGraduateAttribute validity
    week_graduate_attribute_dict = week_graduate_attribute.model_dump()
    week_graduate_attribute_dict["session"] = session
    try:
        db_week_graduate_attribute = WeekGraduateAttribute.model_validate(
            week_graduate_attribute_dict
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    """
    Check user permissions: Workbook contributors, workbook owners, and site admins may delete week
    graduate attributes.
    """
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

    if peek:
        return None

    session.add(db_week_graduate_attribute)
    session.commit()
    session.refresh(db_week_graduate_attribute)
    return db_week_graduate_attribute


# Get requests for viewing entries
@app.get("/api/activity-staff/", dependencies=[Depends(cookie)])
def read_actvity_staff(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    staff_id: uuid.UUID | None = None,
    activity_id: uuid.UUID | None = None,
    peek: bool = Query(False),
) -> List[ActivityStaff] | None:
    """Reads activity-staff from the database.

    The activity-staff table is a link table between users and activities, and
    represents the users responsible for the activity as its staff.

    Depending on the state of staff_id and activity_id, filtering will be applied. The
    set of all activity_staff which staff_id = staff_id and activity_id = activity_id
    will be returned, with no constraint on each row if the input is None (e.g. a get
    request with staff_id=None, activity_id=None, will return all activity-staff rows.)

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        staff_id: The id of the staff member to filter activity-staff results.
        activity_id: The id of the activity to filter activity-staff results.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of matching activity-staff objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

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


@app.get("/api/week-graduate-attributes/", dependencies=[Depends(cookie)])
def read_week_graduate_attributes(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    week_workbook_id: uuid.UUID | None = None,
    week_number: int | None = None,
    graduate_attribute_id: uuid.UUID | None = None,
    peek: bool = Query(False),
) -> List[WeekGraduateAttribute] | None:
    """Reads week-graduate-attributes from the database.

    The week-graduate-attribute table is a link table between weeks and graduate
    attributes, and represents the graduate attributes assigned to a particular week.

    Depending on the state of week_workbook_id, week_number, and graduate_attribute_id,
     filtering will beapplied. The set of all week-graduate-attributes
    which week_workbook_id = week_workbook_id and week_number = week_number,
    graduate_attribute_id = graduate_attribute_id will be returned, where
    week_workbook_id and week_number are the primary keys of the week, with no
    constraint on each row if the input is None (e.g. a get request with
    week_workbook_id=None, week_number=None, graduate_attribute_id=None, will return
    all week-graduate-attributes rows.)

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        week_workbook_id: The id of the workbook part of the week's primary key to
            filter week-graduate-attributes results.
        graduate_attribute_id: The id of the graduate attribute to filter
            week-graduate-attributes results.
        week_number: The number of the week to filter week-graduate-attributes results.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of matching week-graduate-attributes objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

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


@app.get("/api/workbook-contributors/", dependencies=[Depends(cookie)])
def read_workbook_contributors(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    contributor_id: uuid.UUID | None = None,
    workbook_id: uuid.UUID | None = None,
    peek: bool = Query(False),
) -> List[Any] | None:
    """Reads workbook-contributors from the database.

    The workbook-contributor table is a link table between users and workbooks, and
    represents the users who can contribute to the workbook by editing it.

    Depending on the state of contributor_id and workbook_id, filtering will be
    applied. The set of all workbook-contributors which contributor_id =
    contributor_id and workbook_id = workbook_id will be returned, with no constraint
    on each row if the input is None (e.g. a get request with contributor_id=None,
    workbook_id=None, will return all workbook-contributor rows.)

    If only workbook_id is input, then this function returns a list of users, as the
    workbooks are implied and this saves on extra API calls.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        contributor_id: The id of the contributor to filter workbook-contributors by.
        workbook_id: The id of the workbook to filter workbook-contributors by.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of matching workbook-contributor objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    if not contributor_id and not workbook_id:
        return list(session.exec(select(WorkbookContributor)).all())
    if not contributor_id:
        contributors = []
        for user in session.exec(
            select(WorkbookContributor).where(WorkbookContributor.workbook_id == workbook_id)
        ):
            contributors.append(
                session.exec(select(User).where(User.id == user.contributor_id)).first()
            )
        return contributors

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


@app.get("/api/users/", dependencies=[Depends(cookie)])
def read_users(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[User] | None:
    """Reads users from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all user objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(User)).all())


@app.get("/api/permissions-groups/", dependencies=[Depends(cookie)])
def read_permissions_groups(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[PermissionsGroup] | None:
    """Reads permissions-groups from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all permissions-group objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(PermissionsGroup)).all())


@app.get("/api/learning-platforms/", dependencies=[Depends(cookie)])
def read_learning_platforms(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[LearningPlatform] | None:
    """Reads learning-platforms from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all learning-platform objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(LearningPlatform)).all())


@app.get("/api/learning-activities/", dependencies=[Depends(cookie)])
def read_learning_activities(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    learning_platform_id: uuid.UUID | None = None,
    peek: bool = Query(False),
) -> List[LearningActivity] | None:
    """Reads learning-activities from the database.

    If learning_platform_id is not None, it is used to filter the activities, returning
    only those related to the given learning platform.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        learning_platform_id: The id of the learning-platform to filter by.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of matching learning-activities objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    if not learning_platform_id:
        return list(session.exec(select(LearningActivity)).all())
    return list(
        session.exec(
            select(LearningActivity).where(
                LearningActivity.learning_platform_id == learning_platform_id
            )
        )
    )


@app.get("/api/task-statuses/", dependencies=[Depends(cookie)])
def read_task_statuses(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[TaskStatus] | None:
    """Reads task-statuses from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all task-status objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(TaskStatus)).all())


@app.get("/api/learning-types/", dependencies=[Depends(cookie)])
def read_learning_types(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[LearningType] | None:
    """Reads learning-types from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all learning-type objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(LearningType)).all())


@app.get("/api/workbooks/", dependencies=[Depends(cookie)])
def read_workbooks(
    _: SessionData = Depends(verifier),
    workbook_id: uuid.UUID | None = None,
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[Dict[str, Any]] | None:
    """Reads workbooks from the database.

    If workbook_id is not none, returns the specified workbook.

    This request injects some additional data into the workbook model returned, adding
    explicitly the course lead and learning platform fields. This reduces the amount of
    requests made to the backend, as these two fields are used in almost every case
    when the workbook data is used.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        workbook_id: The id of the workbook to return.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all matching workbook objects, model_dumped and with course_lead
        and learning_platform fields added, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

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


@app.get("/api/workbooks/search/", dependencies=[Depends(cookie)])
def search_workbooks(
    name: str | None = None,
    starts_after: datetime.date | None = None,
    ends_before: datetime.date | None = None,
    led_by: str | None = None,
    contributed_by: str | None = None,
    learning_platform: str | None = None,
    area_id: uuid.UUID | None = None,
    school_id: uuid.UUID | None = None,
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[Dict[str, Any]] | None:
    if peek:
        return None

    workbooks = []
    for workbook in session.exec(select(Workbook)):
        # if workbook name provided, returned workbooks must match it.
        if name is not None:
            if not re.search(name, workbook.course_name, re.IGNORECASE):
                continue
        # if workbook lead provided, returned workbooks must match.
        if led_by:
            if workbook.course_lead is None or not re.search(
                led_by, workbook.course_lead.name, re.IGNORECASE
            ):
                continue
        # if workbook contributor is provided, returned workbooks must match.
        if contributed_by:
            matched = False
            for user in workbook.contributors:
                print(user.name)
                if re.search(contributed_by, user.name, re.IGNORECASE):
                    matched = True
                    break
            if not matched:
                continue
        # if learning platform is provided, returned workbooks must match.
        if learning_platform:
            if workbook.learning_platform is None or not re.search(
                learning_platform, workbook.learning_platform.name, re.IGNORECASE
            ):
                continue
        # if starts_after is provided, returned workbooks must start on or after that date
        if starts_after:
            if workbook.start_date < starts_after:
                continue
        # if ends_before is provided, returned workbooks must start on or after that date
        if ends_before:
            if workbook.end_date > ends_before:
                continue
        # if area_id is provided, filter by area
        if area_id:
            if workbook.area_id != area_id:
                continue
        # if school_id is provided, filter by school
        if school_id:
            if workbook.school_id != school_id:
                continue
        workbooks.append(workbook)

    results: List[Dict[str, Any]] = []
    for workbook in workbooks:
        results.append(add_workbook_details(session, workbook))

    return results


@app.get("/api/workbooks/{workbook_id}/export", dependencies=[Depends(cookie)])
def export_workbook_to_excel(
    workbook_id: uuid.UUID,
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> StreamingResponse:
    # Get workbook
    workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not workbook:
        raise HTTPException(status_code=404, detail="Workbook not found")

    # Basic Info
    course_lead = session.get(User, workbook.course_lead_id)
    area = session.get(Area, workbook.area_id)
    school = session.get(Schools, workbook.school_id) if workbook.school_id else None

    activities = session.exec(select(Activity).where(Activity.workbook_id == workbook_id)).all()

    # Transform to DataFrame
    df_basic = pd.DataFrame(
        [
            {
                "Course name": workbook.course_name,
                "Course lead": course_lead.name if course_lead else "",
                "Area": area.name if area else "",
                "School": school.name if school else "",
                "Start Date": workbook.start_date,
                "End Date": workbook.end_date,
            }
        ]
    )

    # Contributors
    df_contributors = pd.DataFrame(
        [{"Contributor name": user.name} for user in workbook.contributors]
        if workbook.contributors
        else [{"Contributor name": "There is no contributor for this course."}]
    )

    # Activities per week
    week_groups: dict[int, list[Activity]] = {}
    for activity in workbook.activities:
        week_groups.setdefault(activity.week_number or 0, []).append(activity)

    # Write Excel
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine="openpyxl") as writer:
        df_basic.to_excel(writer, sheet_name="Basic information", index=False)
        df_contributors.to_excel(writer, sheet_name="Contributors", index=False)

        for week_num, activities in week_groups.items():
            rows = []
            for a in activities:
                row = {
                    "Staff Responsible": ", ".join(user.name for user in a.staff_responsible),
                    "Title / Name": a.name,
                    "Learning Activity": a.learning_activity.name if a.learning_activity else "",
                    "Learning Type": a.learning_type.name if a.learning_type else "",
                    "Activity Location": a.location.name if a.location else "",
                    "Task Status": a.task_status.name if a.task_status else "",
                    "Time (minutes)": a.time_estimate_minutes,
                }
                rows.append(row)
            df_week = pd.DataFrame(rows)
            df_week.to_excel(writer, sheet_name=f"Week{week_num}", index=False)

            # Set column width for Week sheet
            worksheet = writer.sheets[f"Week{week_num}"]
            worksheet.column_dimensions["A"].width = 45
            worksheet.column_dimensions["B"].width = 45
            worksheet.column_dimensions["C"].width = 20
            worksheet.column_dimensions["D"].width = 20
            worksheet.column_dimensions["E"].width = 20
            worksheet.column_dimensions["F"].width = 15
            worksheet.column_dimensions["G"].width = 20

        # Set column width for Basic Information sheet
        worksheet = writer.sheets["Basic information"]
        worksheet.column_dimensions["A"].width = 35
        worksheet.column_dimensions["B"].width = 30
        worksheet.column_dimensions["C"].width = 45
        worksheet.column_dimensions["D"].width = 45
        worksheet.column_dimensions["E"].width = 15
        worksheet.column_dimensions["F"].width = 15

        # Set column width for Basic Information sheet
        worksheet = writer.sheets["Contributors"]
        worksheet.column_dimensions["A"].width = 40

    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={workbook.course_name}.xlsx"},
    )


@app.get("/api/weeks/", dependencies=[Depends(cookie)])
def read_weeks(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    workbook_id: uuid.UUID | None = None,
    week_number: int | None = None,
    peek: bool = Query(False),
) -> List[Week] | None:
    """Reads weeks from the database.

    If the week's primary key is given in the form of workbook_id and week_number, then
    the specified week will be returned. Otherwise if workbook_id is not None, then all
    weeks related to that workbook will be returned. Otherwise all weeks are returned.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        workbook_id: The id of the workbook containing the searched-for week(s).
        week_number: The number of the week searched for, as part of its composite
            primary key. If number is specified but workbook is not, it has no effect.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all matching week objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    if not workbook_id:
        return list(session.exec(select(Week)).all())
    if not week_number:
        return list(session.exec(select(Week).where(Week.workbook_id == workbook_id)))
    return list(
        session.exec(
            select(Week).where(Week.workbook_id == workbook_id, Week.number == week_number)
        )
    )


@app.get("/api/graduate_attributes/", dependencies=[Depends(cookie)])
def read_graduate_attributes(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[GraduateAttribute] | None:
    """Reads graduate-attributes from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all graduate-attribute objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    graduate_attributes = list(session.exec(select(GraduateAttribute)).all())
    return graduate_attributes


@app.get("/api/locations/", dependencies=[Depends(cookie)])
def read_locations(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[Location] | None:
    """Reads locations from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all location objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    locations = list(session.exec(select(Location)).all())
    return locations


@app.get("/api/activities/", dependencies=[Depends(cookie)])
def read_activities(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    workbook_id: uuid.UUID | None = None,
    week_number: int | None = None,
    peek: bool = Query(False),
) -> List[Activity] | None:
    """Reads activities from the database.

    If workbook_id is not None, then returns all activities from the spcified workbook.
    If also week_number is not None, then returns all activities from the specified
    week. If both are None, returns all activities.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        workbook_id: The id of the workbook containing the activities.
        week_number: In conjunction with workbook_id, the id of the week containing
            the activities.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all matching activity objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

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
@app.get("/api/workbooks/{workbook_id}/details", dependencies=[Depends(cookie)])
def get_workbook_details(
    workbook_id: uuid.UUID,
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> Dict[str, Any] | None:
    """Reads workbook from the database.

    This request injects some additional data into the workbook model returned,
    allowing for all relevant information in workbook display to be returned in one
    request, reducing duplicated work and logic on the frontend.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        workbook_id: The id of the workbook to be requested.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all matching workbook objects, model_dumped and with course_lead
        and learning_platform fields added, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    # Fetch workbook
    workbook = session.exec(select(Workbook).where(Workbook.id == workbook_id)).first()
    if not workbook:
        raise HTTPException(status_code=404, detail="Workbook not found")

    # Fetch related data
    response: Dict[str, Any] = add_workbook_details(session, workbook)
    activities = list(session.exec(select(Activity).where(Activity.workbook_id == workbook_id)))

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


@app.get("/api/workbooks/{workbook_id}/week-graduate-attributes", dependencies=[Depends(cookie)])
def read_workbook_graduate_attributes(
    workbook_id: uuid.UUID,
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[WeekGraduateAttribute] | None:
    """Reads week-graduate-attributes from the database.

    Returns all week-graduate-attributes related to the given workbook.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        workbook_id: The id of the related workbook.
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all matching week-graduate-attribute objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(
        session.exec(
            select(WeekGraduateAttribute).where(
                WeekGraduateAttribute.week_workbook_id == workbook_id
            )
        )
    )


@app.get("/api/schools/", dependencies=[Depends(cookie)])
def read_schools(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[Schools] | None:
    """Reads schools from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all user objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(Schools)).all())


@app.get("/api/area/", dependencies=[Depends(cookie)])
def read_area(
    _: SessionData = Depends(verifier),
    session: Session = Depends(get_session),
    peek: bool = Query(False),
) -> List[Area] | None:
    """Reads schools from the database.

    The _: SessionData enables SessionData to be parsed, which will return a 403 if it
    does not exist. This is how authentication is handled when there are no internal
    restrictions i.e. every user can access this, but only if they are authenticated.

    Args:
        session: The database session, separate from authentication session, useful for
            separating concerns between calls.
        peek: A flag which prevents the function from performing any database changes.
            Useful for checking whether a request would fail due to e.g. permissions
            error, without actually executing the request.

    Returns:
        The list of all user objects, or None if peek=True.

    Raises:
        HTTPException(403): if no valid session is provided as a cookie, or if
            permission is denied due to the user's permissions group.
        HTTPException(422): if the request fails due to a database error.
        HTTPException(500): if attempt fails for any other reason.
    """

    if peek:
        return None

    return list(session.exec(select(Area)).all())
