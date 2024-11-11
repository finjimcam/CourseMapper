from typing import Iterator
from sqlmodel import Session, SQLModel, select, create_engine
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


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


def populate_initial_data() -> None:
    """Populate the database with initial data."""
    with Session(engine) as session:
        # Check if initial data already exists
        if session.exec(select(User)).first() is not None:
            print("Initial data already populated.")
            return

        # Insert permission group
        group_admin = PermissionsGroup(id=1, name="Admin")
        group_user = PermissionsGroup(id=2, name="User")

        # Insert user
        user_admin = User(id=1, name="Admin User", permissions_group_id=1)
        user_regular = User(id=2, name="Regular User", permissions_group_id=2)

        # Insert course
        course_math = Course(id=1, course_code="MATH101", name="Mathematics 101")
        course_physics = Course(id=2, course_code="PHYS101", name="Physics 101")

        # Plug-in learning platform
        platform_online = LearningPlatform(id=1, name="Online Platform")
        platform_inperson = LearningPlatform(id=2, name="In-person Platform")

        # Intercalated learning activity
        activity_lecture = LearningActivity(
            id=1, name="Lecture", learning_platform_id=1
        )
        activity_lab = LearningActivity(
            id=2, name="Lab Session", learning_platform_id=2
        )

        # Insert task status
        status_pending = TaskStatus(id=1, name="Pending")
        status_completed = TaskStatus(id=2, name="Completed")

        # Insertion learning type
        type_homework = LearningType(id=1, name="Homework")
        type_exam = LearningType(id=2, name="Exam")

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


# Running this file alone will generate a database with the initial data
if __name__ == "__main__":
    create_db_and_tables()
    populate_initial_data()
