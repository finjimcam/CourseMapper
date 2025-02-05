import datetime
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import ForeignKeyConstraint
from sqlalchemy.orm import Session
from pydantic import model_validator, BaseModel
from typing import Optional, Any, cast
import uuid


# link models
class WorkbookContributorBase(SQLModel):
    contributor_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    workbook_id: uuid.UUID = Field(foreign_key="workbook.id", primary_key=True)


class WorkbookContributor(WorkbookContributorBase, table=True):
    @model_validator(mode="before")
    def check_foreign_keys(
        cls: "WorkbookContributorBase", values: dict[str, Any]
    ) -> dict[str, Any]:
        session: Session = cast(Session, values.get("session"))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        # Validate contributor id
        contributor_id = values.get("contributor_id")
        if contributor_id and not session.query(User).filter(User.id == contributor_id).first():
            raise ValueError(f"Contributor (User) with id {contributor_id} does not exist.")

        # Validate workbook id
        workbook_id = values.get("workbook_id")
        if workbook_id and not session.query(Workbook).filter(Workbook.id == workbook_id).first():
            raise ValueError(f"Workbook with id {workbook_id} does not exist.")

        return values


class WorkbookContributorCreate(WorkbookContributorBase):
    pass


class WorkbookContributorDelete(WorkbookContributorBase):
    def check_primary_keys(
        cls: "WorkbookContributorDelete", session: Session
    ) -> "WorkbookContributorDelete":
        values = cls.model_dump()

        # Validate WorkbookContributor row exists
        contributor_id = values.get("contributor_id")
        workbook_id = values.get("workbook_id")
        if (
            contributor_id
            and workbook_id
            and not session.query(WorkbookContributor)
            .filter(
                WorkbookContributor.workbook_id == workbook_id,
                WorkbookContributor.contributor_id == contributor_id,
            )
            .first()
        ):
            raise ValueError(
                f"Relationship between contributor (User) {contributor_id} and Workbook "
                f"{workbook_id} does not exist."
            )

        return cls


class ActivityStaff(SQLModel, table=True):
    staff_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id", primary_key=True)


class WeekGraduateAttributeBase(SQLModel):
    week_workbook_id: uuid.UUID = Field(primary_key=True)
    week_number: int = Field(primary_key=True)
    graduate_attribute_id: uuid.UUID = Field(foreign_key="graduateattribute.id", primary_key=True)


class WeekGraduateAttribute(WeekGraduateAttributeBase, table=True):
    __table_args__ = (
        ForeignKeyConstraint(
            ["week_workbook_id", "week_number"],
            ["week.workbook_id", "week.number"],
        ),
    )

    @model_validator(mode="before")
    def check_foreign_keys(
        cls: "WeekGraduateAttributeBase", values: dict[str, Any]
    ) -> dict[str, Any]:
        session: Session = cast(Session, values.get("session"))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        # Validate Week
        workbook_id = values.get("week_workbook_id")
        number = values.get("week_number")
        if (
            workbook_id
            and number is not None
            and not session.query(Week)
            .filter(Week.workbook_id == workbook_id, Week.number == number)
            .first()
        ):
            raise ValueError(f"Week number {number} of Workbook {workbook_id} does not exist.")

        # Validate Graduate Attribute
        graduate_attribute_id = values.get("graduate_attribute_id")
        if (
            graduate_attribute_id
            and not session.query(GraduateAttribute)
            .filter(GraduateAttribute.id == graduate_attribute_id)
            .first()
        ):
            raise ValueError(f"Graduate attribute with id {graduate_attribute_id} does not exist.")

        return values


class WeekGraduateAttributeCreate(WeekGraduateAttributeBase):
    pass


class WeekGraduateAttributeDelete(WeekGraduateAttributeBase):
    def check_primary_keys(
        cls: "WeekGraduateAttributeDelete", session: Session
    ) -> "WeekGraduateAttributeDelete":
        values = cls.model_dump()

        # Validate WeekGraduteAttribute row exists
        week_workbook_id = values.get("week_workbook_id")
        week_number = values.get("week_number")
        graduate_attribute_id = values.get("graduate_attribute_id")
        if (
            week_workbook_id
            and week_number is not None
            and graduate_attribute_id
            and not session.query(WeekGraduateAttribute)
            .filter(
                WeekGraduateAttribute.week_workbook_id == week_workbook_id,
                WeekGraduateAttribute.week_number == week_number,
                WeekGraduateAttribute.graduate_attribute_id == graduate_attribute_id,
            )
            .first()
        ):
            raise ValueError(
                f"Relationship between Week number {week_number} of Workbook {week_workbook_id} "
                f"and Graduate Attribute {graduate_attribute_id} does not exist."
            )

        return cls


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
        back_populates="contributors", link_model=WorkbookContributor
    )
    responsible_activity: list["Activity"] = Relationship(
        back_populates="staff_responsible", link_model=ActivityStaff
    )


class PermissionsGroup(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)

    users: list["User"] = Relationship(back_populates="permissions_group")


class WorkbookBase(SQLModel):
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_name: str = Field(index=True)
    course_lead_id: uuid.UUID = Field(foreign_key="user.id")
    learning_platform_id: uuid.UUID = Field(foreign_key="learningplatform.id")


class Workbook(WorkbookBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    number_of_weeks: int = Field(default=0)

    course_lead: Optional["User"] = Relationship(back_populates="workbooks_leading")
    learning_platform: Optional["LearningPlatform"] = Relationship(back_populates="workbooks")

    weeks: list["Week"] = Relationship(back_populates="workbook")
    activities: list["Activity"] = Relationship(back_populates="workbook")

    contributors: list["User"] = Relationship(
        back_populates="workbooks_contributing_to", link_model=WorkbookContributor
    )

    @model_validator(mode="before")
    def check_foreign_keys(cls: "WorkbookBase", values: dict[str, Any]) -> dict[str, Any]:
        session: Session = cast(Session, values.get("session"))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        start_date = values.get("start_date")
        end_date = values.get("end_date")
        if not start_date:
            raise ValueError(f"start_date with {start_date} does not exist.")
        if not end_date:
            raise ValueError(f"end_date with {end_date} does not exist.")
        if start_date >= end_date:
            raise ValueError("start_date must be earlier than end_date.")

        # Validate the course lead ID
        course_lead_id = values.get("course_lead_id")
        if course_lead_id and not session.query(User).filter(User.id == course_lead_id).first():
            raise ValueError(f"course_lead_id with id {course_lead_id} does not exist.")

        # Validate the learning platform ID
        learning_platform_id = values.get("learning_platform_id")
        if (
            learning_platform_id
            and not session.query(LearningPlatform)
            .filter(LearningPlatform.id == learning_platform_id)
            .first()
        ):
            raise ValueError(
                f"learning_platform_id with id {learning_platform_id} does not exist."
            )

        return values


class WorkbookCreate(WorkbookBase):
    pass


class WorkbookUpdate(BaseModel):
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    course_name: Optional[str] = None
    course_lead_id: Optional[uuid.UUID] = None
    learning_platform_id: Optional[uuid.UUID] = None


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


class WeekBase(SQLModel):
    workbook_id: uuid.UUID = Field(foreign_key="workbook.id", primary_key=True)


class Week(WeekBase, table=True):
    number: Optional[int] = Field(primary_key=True, default=0)

    workbook: Optional["Workbook"] = Relationship(back_populates="weeks")

    activities: list["Activity"] = Relationship(back_populates="week")

    graduate_attributes: list["GraduateAttribute"] = Relationship(
        back_populates="weeks", link_model=WeekGraduateAttribute
    )

    @model_validator(mode="before")
    def check_foreign_keys(cls: "WeekBase", values: dict[str, Any]) -> dict[str, Any]:
        session: Session = cast(Session, values.get("session"))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        # Validate Workbook ID
        workbook_id = values.get("workbook_id")
        if workbook_id and not session.query(Workbook).filter(Workbook.id == workbook_id).first():
            raise ValueError(f"Workbook with id {workbook_id} does not exist.")

        return values


class WeekCreate(WeekBase):
    pass


class WeekDelete(SQLModel):
    workbook_id: uuid.UUID
    number: int

    def check_primary_keys(cls: "WeekDelete", session: Session) -> "WeekDelete":
        values = cls.model_dump()

        # Validate Week row exists
        workbook_id = values.get("workbook_id")
        number = values.get("number")
        if (
            workbook_id is not None
            and number is not None
            and not session.query(Week)
            .filter(Week.workbook_id == workbook_id, Week.number == number)
            .first()
        ):
            raise ValueError(f"Week number {number} of Workbook {workbook_id} does not exist.")

        return cls


class GraduateAttribute(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    weeks: list["Week"] = Relationship(
        back_populates="graduate_attributes", link_model=WeekGraduateAttribute
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
    number: Optional[int] = Field(default=0)

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
        session: Session = cast(Session, values.get("session"))

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
        if (
            learning_activity_id
            and not session.query(LearningActivity)
            .filter(LearningActivity.id == learning_activity_id)
            .first()
        ):
            raise ValueError(f"Learning Activity with id {learning_activity_id} does not exist.")

        # Validate the Learning Type ID
        learning_type_id = values.get("learning_type_id")
        if (
            learning_type_id
            and not session.query(LearningType).filter(LearningType.id == learning_type_id).first()
        ):
            raise ValueError(f"Learning Type with id {learning_type_id} does not exist.")

        # Validate the Task Status ID
        task_status_id = values.get("task_status_id")
        if (
            task_status_id
            and not session.query(TaskStatus).filter(TaskStatus.id == task_status_id).first()
        ):
            raise ValueError(f"Task Status with id {task_status_id} does not exist.")

        return values


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    number: Optional[int] = None
    time_estimate_minutes: Optional[int] = None
    location_id: Optional[uuid.UUID] = None
    learning_activity_id: Optional[uuid.UUID] = None
    learning_type_id: Optional[uuid.UUID] = None
    task_status_id: Optional[uuid.UUID] = None


class LearningType(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="learning_type")


class TaskStatus(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="task_status")
