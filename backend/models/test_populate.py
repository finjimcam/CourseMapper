import unittest
from unittest.mock import patch
from sqlmodel import create_engine, Session, select
from models.populate import main
from models.models_base import (
    User,
    PermissionsGroup,
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    LearningType,
)


_CLASSES = {
    "user": User,
    "permissions_group": PermissionsGroup,
    "learning_platform": LearningPlatform,
    "learning_activity": LearningActivity,
    "task_status": TaskStatus,
    "learning_type": LearningType,
}


# Setup a temporary in-memory SQLite database for testing
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})


class TestPopulation(unittest.TestCase):

    @patch("backend.models.populate.engine", new=test_engine)
    def test_populates_db(self) -> None:
        main()

        with Session(test_engine) as session:
            for class_name, class_value in _CLASSES.items():
                self.assertGreater(
                    len(session.exec(select(class_value)).all()),
                    0,
                    f"No {class_name}s were inserted.",
                )
