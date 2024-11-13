import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from typing import Iterator
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
def _get_session() -> Iterator[Session]:
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

        # Insert permission group
        group_admin = PermissionsGroup(id=1, name="Admin")
        group_user = PermissionsGroup(id=2, name="User")

        # Insert user
        user_admin = User(name="Admin User", permissions_group_id=1)
        user_regular = User(name="Regular User", permissions_group_id=2)

        # Insert course
        course_math = Course(course_code="MATH101", name="Mathematics 101")
        course_physics = Course(course_code="PHYS101", name="Physics 101")

        # Plug-in learning platform
        platform_online = LearningPlatform(name="Online Platform")
        platform_inperson = LearningPlatform(name="In-person Platform")

        # Intercalated learning activity
        activity_lecture = LearningActivity(name="Lecture", learning_platform_id=1)
        activity_lab = LearningActivity(name="Lab Session", learning_platform_id=2)

        # Insert task status
        status_pending = TaskStatus(name="Pending")
        status_completed = TaskStatus(name="Completed")

        # Insertion learning type
        type_homework = LearningType(name="Homework")
        type_exam = LearningType(name="Exam")

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

        # Submit data to the database
        session.commit()
        print("Database populated with initial data.")


def main() -> None:
    _create_db_and_tables()
    _populate_initial_data()


# Running this file alone will generate a database with the initial data
if __name__ == "__main__":
    main()
