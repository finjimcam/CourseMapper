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

This is a test module for populate.py.

It mainly exists to check that the database definition are still working as intended,
and does not test any application logic.
"""

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

    @patch("models.populate.engine", new=test_engine)
    def test_populates_db(self) -> None:
        main()

        with Session(test_engine) as session:
            for class_name, class_value in _CLASSES.items():
                self.assertGreater(
                    len(session.exec(select(class_value)).all()),
                    0,
                    f"No {class_name}s were inserted.",
                )
