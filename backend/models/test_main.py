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

This is a test module for main.py.

It mainly exists to check that all functions in main.py are still working as intended.
"""

import pytest
from fastapi.testclient import TestClient
from typing import Dict
from sqlmodel import Session, SQLModel, create_engine, select
from sqlmodel.pool import StaticPool
from typing import Generator, Any
import uuid
import datetime

from main import app, get_session
from models.database import create_db_and_tables
from models.models_base import (
    User,
    PermissionsGroup,
    Workbook,
    Activity,
    Week,
    LearningPlatform,
    Location,
    LearningActivity,
    TaskStatus,
    LearningType,
    WorkbookContributor,
    ActivityStaff,
    WeekGraduateAttribute,
    GraduateAttribute,
)


TEST_SQLITE_URL = "sqlite://"
engine = create_engine(
    TEST_SQLITE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
)


def override_get_session() -> Generator[Session, None, None]:
    """
    Override the get_session function to use a session with a static engine.
    """

    with Session(engine) as session:
        yield session


app.dependency_overrides[get_session] = override_get_session


# Fixtures
@pytest.fixture(scope="module", autouse=True)
def setup_db() -> Generator[None, None, None]:
    """
    Create the database and tables before running tests.
    """

    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client() -> TestClient:
    """
    Create a test client for the app.
    """

    return TestClient(app)


@pytest.fixture
def session() -> Generator[Session, None, None]:
    """
    Create a session for the test.
    """

    with Session(engine) as session:
        yield session


def create_test_user(session: Session, name: str, is_admin: bool = False) -> User:
    group_name = "Admin" if is_admin else "User"
    group = session.exec(
        select(PermissionsGroup).where(PermissionsGroup.name == group_name)
    ).first()
    if not group:
        group = PermissionsGroup(name=group_name)
        session.add(group)
        session.commit()
        session.refresh(group)

    user = User(name=name, permissions_group_id=group.id)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_test_workbook(session: Session, user_id: uuid.UUID) -> Workbook:
    platform = LearningPlatform(name="Test Platform")
    location = Location(name="Test Location")
    task_status = TaskStatus(name="Test Status")
    learning_type = LearningType(name="Test Type")
    learning_activity = LearningActivity(name="Test Activity", learning_platform=platform)

    session.add_all([platform, location, task_status, learning_type, learning_activity])
    session.commit()

    workbook = Workbook(
        start_date=datetime.date(2024, 1, 1),
        end_date=datetime.date(2024, 1, 7),
        course_name="Test Course",
        course_lead_id=user_id,
        learning_platform_id=platform.id,
    )
    session.add(workbook)
    session.commit()
    session.refresh(workbook)
    return workbook


def get_auth_headers(client: TestClient, username: str) -> Dict[str, str]:
    response = client.post(f"/session/{username}")
    assert response.status_code == 200
    cookie = response.headers["set-cookie"]
    return {"Cookie": cookie}


def test_activity_operations(client: TestClient, session: Session) -> None:
    user = create_test_user(session, "owner")
    workbook = create_test_workbook(session, user.id)
    week = Week(workbook_id=workbook.id, number=1)
    session.add(week)
    session.commit()

    headers = get_auth_headers(client, "owner")

    activity_data = {
        "workbook_id": str(workbook.id),
        "week_number": 1,
        "name": "Test Activity",
        "time_estimate_minutes": 60,
        "location_id": str(session.exec(select(Location)).first().id),
        "learning_activity_id": str(session.exec(select(LearningActivity)).first().id),
        "learning_type_id": str(session.exec(select(LearningType)).first().id),
        "task_status_id": str(session.exec(select(TaskStatus)).first().id),
    }
    response = client.post("/activities/", json=activity_data, headers=headers)
    assert response.status_code == 200
    activity_id = response.json()["id"]

    update_data = {"name": "Updated Activity"}
    response = client.patch(f"/activities/{activity_id}", json=update_data, headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Activity"

    response = client.delete(f"/activities/?activity_id={activity_id}", headers=headers)
    assert response.status_code == 200


def test_permission_checks(client: TestClient, session: Session) -> None:

    owner = create_test_user(session, "owner")
    contributor = create_test_user(session, "contributor")
    admin = create_test_user(session, "admin", is_admin=True)
    outsider = create_test_user(session, "outsider")

    workbook = create_test_workbook(session, owner.id)
    wc = WorkbookContributor(workbook_id=workbook.id, contributor_id=contributor.id)
    session.add(wc)
    session.commit()

    test_cases = [("owner", 200), ("contributor", 200), ("admin", 200), ("outsider", 200)]

    for username, expected_code in test_cases:
        headers = get_auth_headers(client, username)
        response = client.get(f"/workbooks/{workbook.id}/details", headers=headers)
        assert response.status_code == expected_code


class TestRead:
    def test_read_users(self, client: TestClient, session: Session) -> None:
        # Test that the /users/ endpoint returns a list of all users.
        headers = get_auth_headers(client, "admin")
        response = client.get("/users/", headers=headers)
        assert response.status_code == 200

    def test_read_permissions_groups(self, client: TestClient, session: Session) -> None:
        # Test that the /permissions-groups/ endpoint returns a list of all permissions groups.
        headers = get_auth_headers(client, "admin")
        response = client.get("/permissions-groups/", headers=headers)
        assert response.status_code == 200

    def test_read_learning_platforms(self, client: TestClient, session: Session) -> None:
        # Test that the /learning-platforms/ endpoint returns a list of all learning platforms.
        headers = get_auth_headers(client, "admin")
        response = client.get("/learning-platforms/", headers=headers)
        assert response.status_code == 200

    def test_read_task_statuses(self, client: TestClient, session: Session) -> None:
        # Test that the /task-statuses/ endpoint returns a list of all task statuses.
        headers = get_auth_headers(client, "admin")
        response = client.get("/task-statuses/", headers=headers)
        assert response.status_code == 200

    def test_read_learning_types(self, client: TestClient, session: Session) -> None:
        # Test that the /learning-types/ endpoint returns a list of all learning types.
        headers = get_auth_headers(client, "admin")
        response = client.get("/learning-types/", headers=headers)
        assert response.status_code == 200

    def test_read_workbooks(self, client: TestClient, session: Session) -> None:
        # Test that the /workbooks/ endpoint returns a list of all workbooks.
        headers = get_auth_headers(client, "admin")
        response = client.get("/workbooks/", headers=headers)
        assert response.status_code == 200

    def test_read_weeks(self, client: TestClient, session: Session) -> None:
        # Test that the /weeks/ endpoint returns a list of all weeks.
        headers = get_auth_headers(client, "admin")
        response = client.get("/weeks/", headers=headers)
        assert response.status_code == 200

    def test_read_graduate_attributes(self, client: TestClient, session: Session) -> None:
        # Test that the /graduate_attributes/ endpoint returns a list of all graduate attributes.
        headers = get_auth_headers(client, "admin")
        response = client.get("/graduate_attributes/", headers=headers)
        assert response.status_code == 200

    def test_read_locations(self, client: TestClient, session: Session) -> None:
        # Test that the /locations/ endpoint returns a list of all locations.
        headers = get_auth_headers(client, "admin")
        response = client.get("/locations/", headers=headers)
        assert response.status_code == 200

    def test_read_activities(self, client: TestClient, session: Session) -> None:
        # Test that the /activities/ endpoint returns a list of all activities.
        headers = get_auth_headers(client, "admin")
        response = client.get("/activities/", headers=headers)
        assert response.status_code == 200


class TestCreate:
    def test_create_session(self, client: TestClient, session: Session) -> None:
        user = create_test_user(session, "testuser")

        # Test that a valid user can log in
        response = client.post("/session/testuser")
        assert response.status_code == 200
        assert "session" in response.headers["set-cookie"]

        # Test that an invalid user cannot log in
        response = client.post("/session/invaliduser")
        assert response.status_code == 422

    def test_create_workbook(self, client: TestClient, session: Session) -> None:
        admin = create_test_user(session, "admin", is_admin=True)
        user = create_test_user(session, "user")

        headers = get_auth_headers(client, "admin")
        platform = LearningPlatform(name="Test Platform")
        session.add(platform)
        session.commit()

        # Test that a workbook can be created by an admin
        workbook_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-07",
            "course_name": "Test Course",
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 200

        # Test that a workbook cannot be created with an invalid platform ID
        workbook_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-07",
            "course_name": "Test Course",
            "learning_platform_id": str(uuid.uuid4()),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

        # Test that a workbook cannot be created with an None course_name
        workbook_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-07",
            "course_name": None,
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

        # Test that a workbook cannot be created with the end date before the start date
        workbook_data = {
            "start_date": "2024-02-01",
            "end_date": "2024-01-07",
            "course_name": "Test Course",
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

        # Test that a workbook cannot be created with the date as None
        workbook_data = {
            "start_date": None,
            "end_date": "2024-01-07",
            "course_name": "Test Course",
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

        workbook_data = {
            "start_date": "2024-02-01",
            "end_date": None,
            "course_name": "Test Course",
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

        # Test that a workbook cannot be created with the date as a non-existent date
        workbook_data = {
            "start_date": "2024-01-35",
            "end_date": "2024-02-07",
            "course_name": "Test Course",
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

        workbook_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-47",
            "course_name": "Test Course",
            "learning_platform_id": str(platform.id),
        }
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 422

    def test_create_week(self, client: TestClient, session: Session):
        admin = create_test_user(session, "admin", is_admin=True)
        user = create_test_user(session, "user")

        headers = get_auth_headers(client, "admin")
        workbook = create_test_workbook(session, user.id)

        # Test that a week can be created by a valid workbook ID
        week_data = {"workbook_id": str(workbook.id)}
        response = client.post("/weeks/", json=week_data, headers=headers)
        assert response.status_code == 200

        # Test that a week cannot be created by a invalid workbook ID
        week_data = {"workbook_id": str(uuid.uuid4())}
        response = client.post("/weeks/", json=week_data, headers=headers)
        assert response.status_code == 422

    def test_create_activity(self, client: TestClient, session: Session) -> None:
        user = create_test_user(session, "admin")
        workbook = create_test_workbook(session, user.id)
        week = Week(workbook_id=workbook.id, number=1)
        session.add(week)
        session.commit()

        headers = get_auth_headers(client, "admin")

        # Test that an activity can be created by a valid user
        activity_data = {
            "workbook_id": str(workbook.id),
            "week_number": 1,
            "name": "Test Activity",
            "time_estimate_minutes": 60,
            "location_id": str(session.exec(select(Location)).first().id),
            "learning_activity_id": str(session.exec(select(LearningActivity)).first().id),
            "learning_type_id": str(session.exec(select(LearningType)).first().id),
            "task_status_id": str(session.exec(select(TaskStatus)).first().id),
        }
        response = client.post("/activities/", json=activity_data, headers=headers)
        assert response.status_code == 200

        # Test that an activity cannot be created with an invalid workbook ID
        activity_data = {
            "workbook_id": str(uuid.uuid4()),
            "week_number": 1,
            "name": "Test Activity",
            "time_estimate_minutes": 60,
            "location_id": str(session.exec(select(Location)).first().id),
            "learning_activity_id": str(session.exec(select(LearningActivity)).first().id),
            "learning_type_id": str(session.exec(select(LearningType)).first().id),
            "task_status_id": str(session.exec(select(TaskStatus)).first().id),
        }
        response = client.post("/activities/", json=activity_data, headers=headers)
        assert response.status_code == 422

        # Test that an activity can be created by a valid user
        activity_data = {
            "workbook_id": str(workbook.id),
            "week_number": 1,
            "name": "Test Activity",
            "time_estimate_minutes": 60,
            "location_id": str(session.exec(select(Location)).first().id),
            "learning_activity_id": str(session.exec(select(LearningActivity)).first().id),
            "learning_type_id": str(session.exec(select(LearningType)).first().id),
            "task_status_id": str(session.exec(select(TaskStatus)).first().id),
        }
        response = client.post("/activities/", json=activity_data, headers=headers)
        assert response.status_code == 200

    def test_create_workbook_contributor(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")
        workbook = session.exec(select(Workbook)).first()
        contributor = create_test_user(session, "test_contributor")

        # Test that a contributor can be created
        contributor_data = {"workbook_id": str(workbook.id), "contributor_id": str(contributor.id)}
        response = client.post("/workbook-contributors/", json=contributor_data, headers=headers)
        assert response.status_code == 200

        # Test that a contributor cannot be created with an invalid workbook ID
        contributor_data = {
            "workbook_id": str(uuid.uuid4()),
            "contributor_id": str(contributor.id),
        }
        response = client.post("/workbook-contributors/", json=contributor_data, headers=headers)
        assert response.status_code == 422

        # Test that a contributor cannot be created with an invalid contributor ID
        contributor_data = {"workbook_id": str(workbook.id), "contributor_id": str(uuid.uuid4())}
        response = client.post("/workbook-contributors/", json=contributor_data, headers=headers)
        assert response.status_code == 422

    def test_create_activity_staff(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")
        workbook = session.exec(select(Workbook)).first()
        week = session.exec(select(Week).where(Week.workbook_id == workbook.id)).first()

        location = Location(name="Test Location")
        session.add(location)
        session.commit()

        activity = Activity(
            workbook_id=workbook.id,
            week_number=week.number,
            name="Test Activity",
            time_estimate_minutes=60,
            location_id=location.id,
            learning_activity_id=uuid.uuid4(),
            learning_type_id=uuid.uuid4(),
            task_status_id=uuid.uuid4(),
        )
        session.add(activity)
        session.commit()
        session.refresh(activity)

        staff = create_test_user(session, "test_staff")

        # Test that a staff can be created
        staff_data = {"activity_id": str(activity.id), "staff_id": str(staff.id)}
        response = client.post("/activity-staff/", json=staff_data, headers=headers)
        assert response.status_code == 200

        # Test that a staff cannot be created with an invalid activity ID
        staff_data = {"activity_id": str(uuid.uuid4()), "staff_id": str(staff.id)}
        response = client.post("/activity-staff/", json=staff_data, headers=headers)
        assert response.status_code == 422

        # Test that a staff cannot be created with an invalid staff ID
        staff_data = {"activity_id": str(activity.id), "staff_id": str(uuid.uuid4())}
        response = client.post("/activity-staff/", json=staff_data, headers=headers)
        assert response.status_code == 422

    def test_create_week_graduate_attribute(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")
        workbook = session.exec(select(Workbook)).first()
        week = session.exec(select(Week).where(Week.workbook_id == workbook.id)).first()
        graduate_attribute = GraduateAttribute(name="Test Attribute")
        session.add(graduate_attribute)
        session.commit()
        session.refresh(graduate_attribute)

        # Test that a graduate attribute can be created
        attribute_data = {
            "week_workbook_id": str(week.workbook_id),
            "week_number": week.number,
            "graduate_attribute_id": str(graduate_attribute.id),
        }
        response = client.post("/week-graduate-attributes/", json=attribute_data, headers=headers)
        assert response.status_code == 200

        # Test that a graduate attribute cannot be created with an invalid week_workbook_id
        attribute_data = {
            "week_workbook_id": str(uuid.uuid4()),
            "week_number": week.number,
            "graduate_attribute_id": str(graduate_attribute.id),
        }
        response = client.post("/week-graduate-attributes/", json=attribute_data, headers=headers)
        assert response.status_code == 422

        # Test that a graduate attribute cannot be created with an invalid graduate_attribute_id
        attribute_data = {
            "week_workbook_id": str(week.workbook_id),
            "week_number": week.number,
            "graduate_attribute_id": str(uuid.uuid4()),
        }
        response = client.post("/week-graduate-attributes/", json=attribute_data, headers=headers)
        assert response.status_code == 422

        # Test that a graduate attribute cannot be created with a None week_number
        attribute_data = {
            "week_workbook_id": str(week.workbook_id),
            "week_number": None,
            "graduate_attribute_id": str(graduate_attribute.id),
        }
        response = client.post("/week-graduate-attributes/", json=attribute_data, headers=headers)
        assert response.status_code == 422


class TestDelete:
    def test_delete_activity_staff(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")
        activity_id = str(uuid.uuid4())
        staff_id = str(uuid.uuid4())
        response = client.delete(
            f"/activity-staff/?activity_id={activity_id}&staff_id={staff_id}", headers=headers
        )
        assert response.status_code in [422]

    def test_delete_workbook_contributor(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")
        workbook_id = str(uuid.uuid4())
        contributor_id = str(uuid.uuid4())
        response = client.delete(
            f"/workbook-contributors/?workbook_id={workbook_id}&contributor_id={contributor_id}",
            headers=headers,
        )
        assert response.status_code in [422]

    def test_delete_week(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")
        workbook_id = str(uuid.uuid4())
        response = client.delete(f"/weeks/?workbook_id={workbook_id}&number=1", headers=headers)
        assert response.status_code in [422]

    def test_delete_week_graduate_attribute(self, client: TestClient, session: Session):
        headers = get_auth_headers(client, "admin")
        week_workbook_id = str(uuid.uuid4())
        graduate_attribute_id = str(uuid.uuid4())
        response = client.delete(
            f"/week-graduate-attributes/?week_workbook_id={week_workbook_id}&week_number=1&graduate_attribute_id={graduate_attribute_id}",
            headers=headers,
        )
        assert response.status_code in [422]

    def test_delete_workbook(self, client: TestClient, session: Session) -> None:
        admin = create_test_user(session, "admin", is_admin=True)
        user = create_test_user(session, "user")

        headers = get_auth_headers(client, "admin")

        workbook_data = {
            "start_date": "2024-01-01",
            "end_date": "2024-01-07",
            "course_name": "Test Course",
            "learning_platform_id": str(uuid.uuid4()),
        }

        platform = LearningPlatform(name="Test Platform")
        session.add(platform)
        session.commit()
        workbook_data["learning_platform_id"] = str(platform.id)

        # Test that a workbook can be created
        response = client.post("/workbooks/", json=workbook_data, headers=headers)
        assert response.status_code == 200
        workbook_id = response.json()["id"]

        # Test that a workbook cannot be deleted by a user who is not an admin
        user_headers = get_auth_headers(client, "user")
        response = client.delete(f"/workbooks/?workbook_id={workbook_id}", headers=user_headers)
        assert response.status_code == 403

        # Test that a workbook can be deleted
        response = client.delete(f"/workbooks/?workbook_id={workbook_id}", headers=headers)
        assert response.status_code == 200

    def test_delete_activity(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")

        # Test that an activity cannot be deleted with an invalid activity ID
        activity_id = str(uuid.uuid4())
        response = client.delete(f"/activities/?activity_id={activity_id}", headers=headers)
        assert response.status_code in [422]

        # Test that an activity can be deleted
        activity = session.exec(select(Activity)).first()
        response = client.delete(f"/activities/?activity_id={activity.id}", headers=headers)
        assert response.status_code in [200]

    def test_delete_session(self, client: TestClient, session: Session) -> None:
        headers = get_auth_headers(client, "admin")

        # Test that a session can be deleted
        response = client.delete("/session/", headers=headers)
        assert response.status_code in [200]


if __name__ == "__main__":
    pytest.main(["-v", "test_main.py"])
