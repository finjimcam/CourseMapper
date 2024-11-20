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

# Atomic (no foreign key) database tables keyed by name for use in population
_PERMISSIONS_GROUPS = {
    "Admin": PermissionsGroup(name="Admin"),
    "User": PermissionsGroup(name="User"),
}
_USERS = {
    "Richard Johnston": User(
        name="Richard Johnston", permissions_group=_PERMISSIONS_GROUPS["Admin"]
    ),
    "Tim Storer": User(
        name="Tim Storer", permissions_group=_PERMISSIONS_GROUPS["User"]
    ),
}
_TASK_STATUSES = {
    "Unassigned": TaskStatus(name="Unassigned"),
    "In Progress": TaskStatus(name="In Progress"),
    "Completed": TaskStatus(name="Completed"),
}
_LEARNING_TYPES = {
    "Acquisition": LearningType(name="Acquisition"),
    "Collaboration": LearningType(name="Collaboration"),
    "Discussion": LearningType(name="Discussion"),
    "Investigation": LearningType(name="Investigation"),
    "Practice": LearningType(name="Practice"),
    "Production": LearningType(name="Production"),
    "Assessment": LearningType(name="Assessment"),
}
_LEARNING_PLATFORMS = {
    "Coursera": LearningPlatform(name="Coursera"),
    "FutureLearn": LearningPlatform(name="FutureLearn"),
    "Moodle": LearningPlatform(name="Moodle"),
    "xSiTe": LearningPlatform(name="xSiTe"),
}


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

        session.add_all(_PERMISSIONS_GROUPS.items())
        session.add_all(_USERS.items())
        session.add_all(_TASK_STATUSES.items())
        session.add_all(_LEARNING_TYPES.items())
        session.add_all(_LEARNING_PLATFORMS.items())

        session.commit()
        print("Database populated with initial data.")


def main() -> None:
    _create_db_and_tables()
    _populate_initial_data()


# Running this file alone will generate a database with the initial data
if __name__ == "__main__":
    main()
