import datetime
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import ForeignKeyConstraint
from sqlalchemy.orm import Session
from pydantic import model_validator
from typing import Optional, Any, cast
import uuid


# link models
class WorkbookContributors(SQLModel, table=True):
    contributor_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    workbook_id: uuid.UUID = Field(foreign_key="workbook.id", primary_key=True)


class ActivityStaff(SQLModel, table=True):
    staff_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id", primary_key=True)


class WeekGraduateAttributes(SQLModel, table=True):
    week_workbook_id: uuid.UUID = Field(primary_key=True)
    week_number: int = Field(primary_key=True)
    graduate_attribute_id: uuid.UUID = Field(foreign_key="graduateattribute.id", primary_key=True)

    __table_args__ = (
        ForeignKeyConstraint(
            ["week_workbook_id", "week_number"],
            ["week.workbook_id", "week.number"],
        ),
    )


"""
models

format:
    fields \\
    1->N relationships \\
    N->1 relationships \\
    N->M relationships \\
"""


class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    permissions_group_id: uuid.UUID = Field(foreign_key="permissionsgroup.id")

    permissions_group: Optional["PermissionsGroup"] = Relationship(back_populates="users")

    workbooks_leading: list["Workbook"] = Relationship(back_populates="course_lead")

    workbooks_contributing_to: list["Workbook"] = Relationship(
        back_populates="contributors", link_model=WorkbookContributors
    )
    responsible_activity: list["Activity"] = Relationship(
        back_populates="staff_responsible", link_model=ActivityStaff
    )


class PermissionsGroup(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)

    users: list["User"] = Relationship(back_populates="permissions_group")


class Workbook(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_lead_id: uuid.UUID = Field(foreign_key="user.id")
    course_id: uuid.UUID = Field(foreign_key="course.id")
    learning_platform_id: uuid.UUID = Field(foreign_key="learningplatform.id")

    course_lead: Optional["User"] = Relationship(back_populates="workbooks_leading")
    course: Optional["Course"] = Relationship(back_populates="workbooks")
    learning_platform: Optional["LearningPlatform"] = Relationship(back_populates="workbooks")

    weeks: list["Week"] = Relationship(back_populates="workbook")
    activities: list["Activity"] = Relationship(back_populates="workbook")

    contributors: list["User"] = Relationship(
        back_populates="workbooks_contributing_to", link_model=WorkbookContributors
    )


class Course(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    course_code: str = Field(nullable=False)
    name: str = Field(nullable=False)

    workbooks: list["Workbook"] = Relationship(back_populates="course")


class LearningPlatform(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    workbooks: list["Workbook"] = Relationship(back_populates="learning_platform")
    learning_activities: list["LearningActivity"] = Relationship(
        back_populates="learning_platform"
    )


class LearningActivity(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)
    learning_platform_id: uuid.UUID = Field(foreign_key="learningplatform.id")

    learning_platform: Optional["LearningPlatform"] = Relationship(
        back_populates="learning_activities"
    )

    activities: list["Activity"] = Relationship(back_populates="learning_activity")


class Week(SQLModel, table=True):
    workbook_id: uuid.UUID = Field(foreign_key="workbook.id", primary_key=True)
    number: Optional[int] = Field(primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)

    workbook: Optional["Workbook"] = Relationship(back_populates="weeks")

    activities: list["Activity"] = Relationship(back_populates="week")

    graduate_attributes: list["GraduateAttribute"] = Relationship(
        back_populates="weeks", link_model=WeekGraduateAttributes
    )


class GraduateAttribute(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    weeks: list["Week"] = Relationship(
        back_populates="graduate_attributes", link_model=WeekGraduateAttributes
    )


class Location(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="location")


class ActivityBase(SQLModel):
    workbook_id: uuid.UUID = Field(foreign_key="workbook.id")
    week_number: Optional[int] = Field(foreign_key="week.number")
    name: str = Field(nullable=False)
    time_estimate_minutes: Optional[int] = Field(nullable=False)
    location_id: uuid.UUID = Field(
        nullable=False,
        foreign_key="location.id",
    )
    learning_activity_id: uuid.UUID = Field(
        nullable=False,
        foreign_key="learningactivity.id",
    )
    learning_type_id: uuid.UUID = Field(
        nullable=False,
        foreign_key="learningtype.id",
    )
    task_status_id: uuid.UUID = Field(nullable=False, foreign_key="taskstatus.id")


class Activity(ActivityBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    location: Optional["Location"] = Relationship(back_populates="activities")
    workbook: Optional["Workbook"] = Relationship(back_populates="activities")
    week: Optional["Week"] = Relationship(back_populates="activities")
    learning_activity: Optional["LearningActivity"] = Relationship(back_populates="activities")
    learning_type: Optional["LearningType"] = Relationship(back_populates="activities")
    task_status: Optional["TaskStatus"] = Relationship(back_populates="activities")

    staff_responsible: list["User"] = Relationship(
        back_populates="responsible_activity", link_model=ActivityStaff
    )

    @model_validator(mode="before")
    def check_foreign_keys(cls: "ActivityBase", values: dict[str, Any]) -> dict[str, Any]:
        session: Session = cast(Session, values.get('session'))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        # Validate the Workbook ID
        workbook_id = values.get("workbook_id")
        if workbook_id and not session.query(Workbook).filter(Workbook.id == workbook_id).first():
            raise ValueError(f"Workbook with id {workbook_id} does not exist.")

        # Validate the Location ID
        location_id = values.get("location_id")
        if location_id and not session.query(Location).filter(Location.id == location_id).first():
            raise ValueError(f"Location with id {location_id} does not exist.")

        # Validate the Learning Activity ID
        learning_activity_id = values.get("learning_activity_id")
        if learning_activity_id and not session.query(LearningActivity).filter(LearningActivity.id == learning_activity_id).first():
            raise ValueError(f"Learning Activity with id {learning_activity_id} does not exist.")

        # Validate the Learning Type ID
        learning_type_id = values.get("learning_type_id")
        if learning_type_id and not session.query(LearningType).filter(LearningType.id == learning_type_id).first():
            raise ValueError(f"Learning Type with id {learning_type_id} does not exist.")

        # Validate the Task Status ID
        task_status_id = values.get("task_status_id")
        if task_status_id and not session.query(TaskStatus).filter(TaskStatus.id == task_status_id).first():
            raise ValueError(f"Task Status with id {task_status_id} does not exist.")

        return values


class ActivityCreate(ActivityBase):
    pass


class LearningType(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="learning_type")


class TaskStatus(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="task_status")
