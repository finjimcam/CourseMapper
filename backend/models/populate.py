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

This module populates the database with initial data for testing purposes.
"""

import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

import datetime
import pandas as pd
from typing import Iterator
from sqlmodel import Session, SQLModel, select, create_engine
from contextlib import contextmanager
from models.models_base import (
    User,
    PermissionsGroup,
    Week,
    Workbook,
    WorkbookContributor,
    Activity,
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    Location,
    LearningType,
    GraduateAttribute,
    Area,
    Schools,
)

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_SQLITE_FILE_NAME = os.path.join(_BACKEND_DIR, "database.db")
_SQLITE_URL = f"sqlite:///{_SQLITE_FILE_NAME}"

_LEGEND_CSV_PATH = os.path.join(os.path.dirname(__file__), "../data/Legend.csv")
_WEEK_CSV_PATHS = {
    n: os.path.join(os.path.dirname(__file__), f"../data/Week{n}.csv") for n in range(1, 4)
}

connect_args = {"check_same_thread": False}
engine = create_engine(_SQLITE_URL, connect_args=connect_args)


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

        # define the Area and the Schools
        area_schools = {
            "College of Arts & Humanities": [
                "School of Critical Studies",
                "School of Culture and Creative Arts",
                "School of Humanities | Sgoil nan Daonnachdan",
                "School of Modern Languages and Cultures",
            ],
            "College of Medical, Veterinary & Life Sciences": [
                "School of Biodiversity, One Health & Veterinary Medicine",
                "School of Cancer Sciences",
                "School of Cardiovascular & Metabolic Health",
                "School of Health & Wellbeing",
                "School of Infection & Immunity",
                "School of Medicine, Dentistry & Nursing",
                "School of Molecular Biosciences",
                "School of Psychology & Neuroscience",
            ],
            "College of Science & Engineering": [
                "School of Chemistry",
                "School of Computing Science",
                "James Watt School of Engineering",
                "School of Geographical & Earth Sciences",
                "School of Mathematics & Statistics",
                "School of Physics & Astronomy",
                "Scottish Universities Environmental Research Centre (SUERC)",
            ],
            "College of Social Sciences": [
                "Adam Smith Business School",
                "School of Education",
                "School of Law",
                "School of Social & Environmental Sustainability",
                "School of Social & Political Sciences",
                "Graduate School",
            ],
            "University Services": [],
        }

        # Create Area and Schools
        areas = {}
        schools = {}

        for area_name, school_list in area_schools.items():
            area = Area(name=area_name)
            session.add(area)
            session.flush()  # Refresh ahead to get the ID

            areas[area_name] = area

            for school_name in school_list:
                school = Schools(name=school_name, area_id=area.id)
                session.add(school)
                schools[school_name] = school

        session.commit()

        dataframe = pd.read_csv(_LEGEND_CSV_PATH)

        locations = {}
        task_statuses = {}
        learning_types = {}
        graduate_attributes = {}
        learning_platforms = {}
        learning_activities: dict[str, dict[str, LearningActivity]] = {}

        for location in dataframe["Activity Location"].dropna():
            locations[location] = Location(name=location)
        for task_status in dataframe["Task Status"].dropna():
            task_statuses[task_status] = TaskStatus(name=task_status)
        for learning_type in dataframe["Learning Type"].dropna():
            learning_types[learning_type] = LearningType(name=learning_type)
        for graduate_attribute in dataframe["Graduate Attribute"].dropna():
            graduate_attributes[graduate_attribute] = GraduateAttribute(name=graduate_attribute)
        for learning_platform in dataframe["Learning Platform"].dropna():
            learning_platforms[learning_platform] = LearningPlatform(name=learning_platform)
            learning_activities[learning_platform] = {}
            for learning_activity in dataframe[learning_platform].dropna():
                learning_activities[learning_platform][learning_activity] = LearningActivity(
                    name=learning_activity,
                    learning_platform=learning_platforms[learning_platform],
                )

        weeks = {}
        activities = []
        permissions_groups = {
            "User": PermissionsGroup(name="User"),
            "Admin": PermissionsGroup(name="Admin"),
        }
        users = {
            "Tim Storer": User(
                id="testid1",
                name="Tim Storer",
                email="tim.storer@fake_domain.com",
                permissions_group=permissions_groups["User"],
            ),
            "Richard Johnston": User(
                id="testid2",
                name="Richard Johnston",
                email="richard.johnston@fake_domain.com",
                permissions_group=permissions_groups["Admin"],
            ),
            "Scott Ramsey": User(
                id="testid3",
                name="Scott Ramsey",
                email="scott.ramsey@fake_domain.com",
                permissions_group=permissions_groups["User"],
            ),
            "Andrew Struan": User(
                id="testid4",
                name="Andrew Struan",
                email="andrew.struan@fake_domain.com",
                permissions_group=permissions_groups["User"],
            ),
            "Caitlin Diver": User(
                id="testid5",
                name="Caitlin Diver",
                email="caitlin.diver@fake_domain.com",
                permissions_group=permissions_groups["User"],
            ),
            "Jennifer Boyle": User(
                id="testid6",
                name="Jennifer Boyle",
                email="jennifer.boyle@fake_domain.com",
                permissions_group=permissions_groups["User"],
            ),
        }

        selected_area = session.exec(
            select(Area).where(Area.name == "College of Science & Engineering")
        ).first()
        selected_school = session.exec(
            select(Schools).where(Schools.name == "School of Computing Science")
        ).first()

        if not selected_area:
            raise ValueError(
                "Error: Area 'College of Science & Engineering' not found in the database."
            )

        if not selected_school:
            raise ValueError(
                "Error: School 'School of Computing Science' not found in the database."
            )

        workbook = Workbook(
            start_date=datetime.date(2024, 9, 23),
            end_date=datetime.date(2024, 9, 23) + datetime.timedelta(weeks=3),
            course_lead=users["Tim Storer"],
            course_name="Professional Software Development",
            learning_platform=learning_platforms["Moodle"],
            area_id=selected_area.id,
            school_id=selected_school.id,
            contributors=[users["Jennifer Boyle"], users["Caitlin Diver"]],
        )
        if workbook.learning_platform is None:
            raise Exception("Workbook not correctly populated. This is a problem with the script.")
        for week_no in _WEEK_CSV_PATHS:
            dataframe = pd.read_csv(_WEEK_CSV_PATHS[week_no])
            weeks[week_no] = Week(
                number=week_no,
                workbook=workbook,
                start_date=workbook.start_date + datetime.timedelta(weeks=week_no - 1),
                end_date=workbook.start_date
                + datetime.timedelta(weeks=week_no - 1)
                + datetime.timedelta(days=4),
                graduate_attributes=[
                    graduate_attributes[graduate_attribute]
                    for graduate_attribute in dataframe["Graduate Attribute"].dropna()
                ],
            )
            for i in range(len(dataframe)):
                name = dataframe["Title / Name"].iloc[i]
                staff_responsible = dataframe["Staff Responsible"].iloc[i]
                learning_activity = dataframe["Learning Activity"].iloc[i]
                learning_type = dataframe["Learning Type"].iloc[i]
                time_estimate = int(dataframe["Time (in mins)"].iloc[i])
                task_status = dataframe["Task Status"].iloc[i]
                location = dataframe["Activity Location"].iloc[i]

                activity = Activity(
                    week=weeks[week_no],
                    number=i + 1,
                    workbook=workbook,
                    name=name,
                    location=locations[location],
                    learning_activity=learning_activities[workbook.learning_platform.name][
                        learning_activity
                    ],
                    learning_type=learning_types[learning_type],
                    time_estimate_minutes=time_estimate,
                    task_status=(
                        task_statuses[task_status]
                        if not pd.isna(task_status)
                        else task_statuses["Unassigned"]
                    ),
                )

                # Add staff responsibility if staff is specified
                if not pd.isna(staff_responsible) and staff_responsible in users:
                    activity.staff_responsible.append(users[staff_responsible])

                activities.append(activity)
        workbook.number_of_weeks = len(weeks)

        session.add_all(locations.values())
        session.add_all(task_statuses.values())
        session.add_all(learning_types.values())
        session.add_all(graduate_attributes.values())
        session.add_all(learning_platforms.values())
        for platform_activities in learning_activities.values():
            session.add_all(platform_activities.values())
        session.add_all(weeks.values())
        session.add_all(activities)
        session.add_all(permissions_groups.values())
        session.add_all(users.values())
        session.add(workbook)

        session.commit()
        print("Database populated with initial data.")


def main() -> None:
    _create_db_and_tables()
    _populate_initial_data()


# Running this file alone will generate a database with the initial data
if __name__ == "__main__":
    main()
