import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

import uuid
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

        if session.exec(select(User)).first() is not None:
            print("Initial data already populated.")
            return

        permissions_groups = [
            PermissionsGroup(id=1, name="Admin"),
            PermissionsGroup(id=2, name="User"),
        ]
        session.add_all(permissions_groups)
        users = [
            User(id=1, name="Richard Johnston", permissions_group_id=1),
            User(id=2, name="Tim Storer", permissions_group_id=2),
        ]
        session.add_all(users)
        task_statuses = [
            TaskStatus(id=1, name="Unassigned"),
            TaskStatus(id=2, name="In Progress"),
            TaskStatus(id=3, name="Completed"),
        ]
        session.add_all(task_statuses)
        learning_types = [
            LearningType(id=1, name="Acquisition"),
            LearningType(id=2, name="Collaboration"),
            LearningType(id=3, name="Discussion"),
            LearningType(id=4, name="Investigation"),
            LearningType(id=5, name="Practice"),
            LearningType(id=6, name="Production"),
            LearningType(id=7, name="Assessment"),
        ]
        session.add_all(learning_types)
        learning_platforms = [
            LearningPlatform(id=1, name="Coursera"),
            LearningPlatform(id=2, name="FutureLearn"),
            LearningPlatform(id=3, name="Moodle"),
        ]
        session.add_all(learning_platforms)

        session.commit()
        print("Database populated with initial data.")


def main() -> None:
    _create_db_and_tables()
    _populate_initial_data()


# Running this file alone will generate a database with the initial data
if __name__ == "__main__":
    main()
