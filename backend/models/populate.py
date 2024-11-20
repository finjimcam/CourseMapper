import sys
import os
import uuid
from sqlmodel import Session, SQLModel, select, create_engine
from contextlib import contextmanager
from backend.models.models import (
    User,
    PermissionsGroup,
    Course,
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    LearningType,
)

sqlite_file_name = "backend/database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


@contextmanager
def _get_session() -> Session:
    with Session(engine) as session:
        yield session


def _create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def _populate_initial_data() -> None:
    """Populate the database with initial data."""
    with _get_session() as session:
        # Check if initial data already exists
        if session.exec(select(User)).first() is not None:
            print("Initial data already populated.")
            return

        # Insert permission groups
        group_admin = PermissionsGroup(id=uuid.uuid4(), name="Admin")
        group_user = PermissionsGroup(id=uuid.uuid4(), name="User")

        # Insert users
        user_admin = User(
            id=uuid.uuid4(), name="Admin User", permissions_group=group_admin
        )
        user_regular = User(
            id=uuid.uuid4(), name="Regular User", permissions_group=group_user
        )

        # Insert courses
        course_math = Course(
            id=uuid.uuid4(), course_code="MATH101", name="Mathematics 101"
        )
        course_physics = Course(
            id=uuid.uuid4(), course_code="PHYS101", name="Physics 101"
        )

        # Insert learning platforms
        platform_online = LearningPlatform(id=uuid.uuid4(), name="Online Platform")
        platform_inperson = LearningPlatform(id=uuid.uuid4(), name="In-person Platform")

        # Insert learning activities
        activity_lecture = LearningActivity(
            id=uuid.uuid4(), name="Lecture", learning_platform=platform_online
        )
        activity_lab = LearningActivity(
            id=uuid.uuid4(), name="Lab Session", learning_platform=platform_inperson
        )

        # Insert task statuses
        status_pending = TaskStatus(id=uuid.uuid4(), name="Pending")
        status_completed = TaskStatus(id=uuid.uuid4(), name="Completed")

        # Insert learning types
        type_homework = LearningType(id=uuid.uuid4(), name="Homework")
        type_exam = LearningType(id=uuid.uuid4(), name="Exam")

        # Add all initial data to the session
        session.add_all(
            [
                group_admin,
                group_user,
                user_admin,
                user_regular,
                course_math,
                course_physics,
                platform_online,
                platform_inperson,
                activity_lecture,
                activity_lab,
                status_pending,
                status_completed,
                type_homework,
                type_exam,
            ]
        )

        # Commit changes to the database
        session.commit()
        print("Database populated with initial data.")


def main() -> None:
    _create_db_and_tables()
    _populate_initial_data()


# Running this file alone will generate a database with the initial data
if __name__ == "__main__":
    main()
