import datetime
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import ForeignKeyConstraint
from typing import Optional
import uuid
from uuid import UUID


def generate_uuid():
    return str(uuid.uuid4())


# link models
class WorkbookContributors(SQLModel, table=True):
    contributor_id: Optional[UUID] = Field(
        default_factory=generate_uuid, foreign_key="user.id", primary_key=True
    )
    workbook_id: Optional[UUID] = Field(
        default_factory=generate_uuid, foreign_key="workbook.id", primary_key=True
    )


class ActivityStaff(SQLModel, table=True):
    staff_id: Optional[UUID] = Field(
        default_factory=generate_uuid, foreign_key="user.id", primary_key=True
    )
    activity_workbook_id: Optional[UUID] = Field(
        default_factory=generate_uuid, foreign_key="workbook.id", primary_key=True
    )
    activity_week_number: Optional[int] = Field(primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ["activity_workbook_id", "activity_week_number"],
            ["activity.workbook_id", "activity.week_number"],
        ),
    )


"""
models

format:
    fields
    1->N relationships
    N->1 relationships
    N->M relationships
"""


class User(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    name: str = Field(index=True)
    permissions_group_id: Optional[UUID] = Field(foreign_key="permissionsgroup.id")

    permissions_group: Optional["PermissionsGroup"] = Relationship(
        back_populates="users"
    )

    workbooks_leading: list["Workbook"] = Relationship(back_populates="course_lead")

    workbooks_contributing_to: list["Workbook"] = Relationship(
        back_populates="contributors", link_model=WorkbookContributors
    )
    responsible_activity: list["Activity"] = Relationship(
        back_populates="staff_responsible", link_model=ActivityStaff
    )


class PermissionsGroup(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    name: str = Field(index=True)

    users: list["User"] = Relationship(back_populates="permissions_group")


class Workbook(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_lead_id: Optional[UUID] = Field(foreign_key="user.id")
    course_id: Optional[UUID] = Field(foreign_key="course.id")
    learning_platform_id: Optional[UUID] = Field(foreign_key="learningplatform.id")

    course_lead: Optional["User"] = Relationship(back_populates="workbooks_leading")
    course: Optional["Course"] = Relationship(back_populates="workbooks")
    learning_platform: Optional["LearningPlatform"] = Relationship(
        back_populates="workbooks"
    )

    weeks: list["Week"] = Relationship(back_populates="workbook")
    activities: list["Activity"] = Relationship(back_populates="workbook")

    contributors: list["User"] = Relationship(
        back_populates="workbooks_contributing_to", link_model=WorkbookContributors
    )


class Course(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    course_code: str = Field(nullable=False)
    name: str = Field(nullable=False)

    workbooks: list["Workbook"] = Relationship(back_populates="course")


class LearningPlatform(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    name: str = Field(nullable=False)

    workbooks: list["Workbook"] = Relationship(back_populates="learning_platform")
    learning_activities: list["LearningActivity"] = Relationship(
        back_populates="learning_platform"
    )


class LearningActivity(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    name: str = Field(nullable=False)
    learning_platform_id: Optional[UUID] = Field(foreign_key="learningplatform.id")

    learning_platform: Optional["LearningPlatform"] = Relationship(
        back_populates="learning_activities"
    )

    activities: list["Activity"] = Relationship(back_populates="learning_activity")


class Week(SQLModel, table=True):
    workbook_id: Optional[UUID] = Field(foreign_key="workbook.id", primary_key=True)
    number: Optional[int] = Field(primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)

    workbook: Optional["Workbook"] = Relationship(back_populates="weeks")

    activities: list["Activity"] = Relationship(back_populates="week")


class Activity(SQLModel, table=True):
    workbook_id: Optional[UUID] = Field(foreign_key="workbook.id", primary_key=True)
    week_number: Optional[int] = Field(foreign_key="week.number", primary_key=True)
    name: str = Field(nullable=False)
    time_estimate_minutes: Optional[int] = Field(nullable=False)
    location: str = Field(nullable=False)
    learning_activity_id: Optional[UUID] = Field(
        nullable=False,
        foreign_key="learningactivity.id",
    )
    learning_type_id: Optional[UUID] = Field(
        nullable=False,
        foreign_key="learningtype.id",
    )
    task_status_id: Optional[UUID] = Field(nullable=False, foreign_key="taskstatus.id")

    workbook: Optional["Workbook"] = Relationship(back_populates="activities")
    week: Optional["Week"] = Relationship(back_populates="activities")
    learning_activity: Optional["LearningActivity"] = Relationship(
        back_populates="activities"
    )
    learning_type: Optional["LearningType"] = Relationship(back_populates="activities")
    task_status: Optional["TaskStatus"] = Relationship(back_populates="activities")

    staff_responsible: list["User"] = Relationship(
        back_populates="responsible_activity", link_model=ActivityStaff
    )


class LearningType(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="learning_type")


class TaskStatus(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=generate_uuid, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="task_status")
