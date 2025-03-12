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
"""

import sys
import os
import random
import datetime
import uuid
from typing import List, Dict, Any, Sequence
from sqlmodel import Session, select

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from models.database import engine
from models.models_base import (
    User,
    Week,
    Workbook,
    Activity,
    LearningPlatform,
    LearningActivity,
    TaskStatus,
    Location,
    LearningType,
    GraduateAttribute,
    WorkbookContributor,
    ActivityStaff,
    Area,
    Schools,
)

# Course names for random generation
COURSE_NAMES = [
    "Introduction to Computer Science",
    "Advanced Programming Techniques",
    "Data Structures and Algorithms",
    "Web Development Fundamentals",
    "Database Management Systems",
    "Software Engineering Principles",
    "Artificial Intelligence Basics",
    "Machine Learning Fundamentals",
    "Computer Networks",
    "Operating Systems",
    "Cybersecurity Essentials",
    "Cloud Computing",
    "Mobile App Development",
    "Game Development",
    "Computer Graphics",
    "Digital Signal Processing",
    "Embedded Systems",
    "Robotics Engineering",
    "Computer Architecture",
    "Quantum Computing",
    "Blockchain Technology",
    "Internet of Things",
    "Big Data Analytics",
    "Natural Language Processing",
    "Computer Vision",
    "Parallel Computing",
    "Distributed Systems",
    "Information Theory",
    "Cryptography",
    "Human-Computer Interaction",
    "Virtual Reality",
    "Augmented Reality",
    "Compiler Design",
    "Theory of Computation",
    "Digital Logic Design",
    "Microprocessors",
    "Computer Ethics",
    "Technical Writing",
    "Project Management",
    "Research Methods",
]

# Activity names for random generation
ACTIVITY_NAMES = [
    "Lecture",
    "Tutorial",
    "Lab Session",
    "Workshop",
    "Group Discussion",
    "Individual Assignment",
    "Team Project",
    "Quiz",
    "Presentation",
    "Case Study",
    "Research Task",
    "Peer Review",
    "Reading Assignment",
    "Video Lecture",
    "Practice Exercise",
]


def create_workbook(
    session: Session,
    course_name: str,
    start_date: datetime.date,
    num_weeks: int,
    users: Sequence[User],
    learning_platforms: Sequence[LearningPlatform],
    locations: Sequence[Location],
    learning_types: Sequence[LearningType],
    task_statuses: Sequence[TaskStatus],
    graduate_attributes: Sequence[GraduateAttribute],
    areas: Sequence[Area],
    schools_by_area: Dict[uuid.UUID, List[Schools]],
) -> None:
    """Create a single workbook with all its associated data"""

    # Select a random Area and its corresponding School
    selected_area = random.choice(areas)
    available_schools = schools_by_area.get(selected_area.id, [])
    selected_school = random.choice(available_schools) if available_schools else None

    # Select random course lead and platform
    course_lead = random.choice(users)
    learning_platform = random.choice(learning_platforms)

    # Create workbook
    workbook = Workbook(
        start_date=start_date,
        end_date=start_date + datetime.timedelta(weeks=num_weeks),
        course_name=course_name,
        course_lead_id=course_lead.id,
        learning_platform_id=learning_platform.id,
        number_of_weeks=num_weeks,
        area_id=selected_area.id,
        school_id=selected_school.id if selected_school else None,
    )
    session.add(workbook)
    session.commit()

    # Add contributors based on available users
    available_users = [u for u in users if u != course_lead]
    num_contributors = min(len(available_users), random.randint(1, 2))  # Reduced from 2-3 to 1-2

    if available_users and num_contributors > 0:
        contributors = random.sample(available_users, k=num_contributors)
        for contributor in contributors:
            workbook_contributor = WorkbookContributor(
                contributor_id=contributor.id, workbook_id=workbook.id
            )
            session.add(workbook_contributor)

    # Get learning activities for the chosen platform
    learning_activities = session.exec(
        select(LearningActivity).where(
            LearningActivity.learning_platform_id == learning_platform.id
        )
    ).all()

    # Create weeks and activities
    for week_num in range(1, num_weeks + 1):
        week = Week(workbook_id=workbook.id, number=week_num)
        session.add(week)

        # Add 2-4 random graduate attributes to the week
        week_grad_attrs = random.sample(graduate_attributes, k=random.randint(2, 4))
        week.graduate_attributes = week_grad_attrs

        # Create 3-7 activities for the week
        num_activities = random.randint(3, 7)
        for activity_num in range(1, num_activities + 1):
            activity = Activity(
                workbook_id=workbook.id,
                week_number=week_num,
                number=activity_num,
                name=f"{random.choice(ACTIVITY_NAMES)} {activity_num}",
                time_estimate_minutes=random.choice([30, 45, 60, 90, 120]),
                location_id=random.choice(locations).id,
                learning_activity_id=random.choice(learning_activities).id,
                learning_type_id=random.choice(learning_types).id,
                task_status_id=random.choice(task_statuses).id,
            )
            session.add(activity)

            # Add 1-2 random staff members responsible for the activity
            staff = random.sample(users, k=random.randint(1, 2))
            for staff_member in staff:
                activity_staff = ActivityStaff(staff_id=staff_member.id, activity_id=activity.id)
                session.add(activity_staff)

    session.commit()


def populate_many_workbooks() -> None:
    """Create 40 unique workbooks with varied data"""
    with Session(engine) as session:
        # Get all existing data from database
        users = session.exec(select(User)).all()

        # Check if we have enough users
        if len(users) < 2:  # Need at least 2 users (1 lead + 1 potential contributor)
            print("Error: Not enough users in database. Need at least 2 users.")
            return

        learning_platforms = session.exec(select(LearningPlatform)).all()
        locations = session.exec(select(Location)).all()
        learning_types = session.exec(select(LearningType)).all()
        task_statuses = session.exec(select(TaskStatus)).all()
        graduate_attributes = session.exec(select(GraduateAttribute)).all()
        areas = session.exec(select(Area)).all()
        schools = session.exec(select(Schools)).all()

        # Organize Schools by Area
        schools_by_area: Dict[uuid.UUID, List[Schools]] = {}
        for school in schools:
            if school.area_id not in schools_by_area:
                schools_by_area[school.area_id] = []
            schools_by_area[school.area_id].append(school)

        if not all(
            [
                users,
                learning_platforms,
                locations,
                learning_types,
                task_statuses,
                graduate_attributes,
                areas,
            ]
        ):
            print("Error: Required base data not found in database. Run populate.py first.")
            return

        # Create workbooks spread across 2 years
        start_date = datetime.date(2024, 1, 1)
        for i in range(40):
            # Randomly offset start date within 2 years
            days_offset = random.randint(0, 365 * 2)
            workbook_start = start_date + datetime.timedelta(days=days_offset)

            # Create workbook with random number of weeks (4-12)
            create_workbook(
                session=session,
                course_name=COURSE_NAMES[i],
                start_date=workbook_start,
                num_weeks=random.randint(4, 12),
                users=users,
                learning_platforms=learning_platforms,
                locations=locations,
                learning_types=learning_types,
                task_statuses=task_statuses,
                graduate_attributes=graduate_attributes,
                areas=areas,
                schools_by_area=schools_by_area,
            )

        print("Successfully created 40 workbooks with associated data")


if __name__ == "__main__":
    populate_many_workbooks()
