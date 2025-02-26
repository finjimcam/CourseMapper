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

This module defines the models and links of the database.
"""

import datetime
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy import ForeignKeyConstraint
from sqlalchemy.orm import Session
from pydantic import model_validator, BaseModel
from typing import Optional, Any, cast
import uuid


# link models
class WorkbookContributorBase(SQLModel):
    """The base model for a workbook contributor.

    This base model does not include relationships nor validation, only the identities
    that define what it is to be a WorkbookContributor, and is then extended by other
    models. It is also not represented by a table in the database.

    Attributes:
        contributor_id: The id of the related contributor (user).
        workbook_id: The id of the related workbook.
    """

    contributor_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    workbook_id: uuid.UUID = Field(foreign_key="workbook.id", primary_key=True)


class WorkbookContributor(WorkbookContributorBase, table=True):
    """The table model for a workbook contributor.

    This is how workbook contributors are represented in the database.

    A workbook contributor is a link model between workbooks and users, representing
    uers which contribute to given workbooks.
    """

    @model_validator(mode="before")
    def check_foreign_keys(
        cls: "WorkbookContributorBase", values: dict[str, Any]
    ) -> dict[str, Any]:
        """Model validation.

        This model validation function runs before any workbook contributor is created.

        raises:
            ValueError: If the input data is not valid.
        """

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
    """The data model for creating a workbook contributor.
    """
    
    pass


class WorkbookContributorDelete(WorkbookContributorBase):
    """The data model for deleting a workbook contributor.
    """

    def check_primary_keys(
        cls: "WorkbookContributorDelete", session: Session
    ) -> "WorkbookContributorDelete":
        """Model validation.

        This model validation function is not marked to run automatically, and must be
        manually called. It expects the session as input in order to validate the keys
        before attempting deletion.

        raises:
            ValueError: If the input data is not valid.
        """

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


class ActivityStaffBase(SQLModel):
    """The base model for an activity staff.

    This base model does not include relationships nor validation, only the identities
    that define what it is to be an ActivityStaff, and is then extended by other
    models. It is also not represented by a table in the database.

    Attributes:
        staff_id: The id of the related staff (user).
        activity_id: The id of the related activity.
    """

    staff_id: uuid.UUID = Field(foreign_key="user.id", primary_key=True)
    activity_id: uuid.UUID = Field(foreign_key="activity.id", primary_key=True)


class ActivityStaff(ActivityStaffBase, table=True):
    """The table model for an activity staff.

    This is how activity staff are represented in the database.

    An activity staff is a link model between activities and users, representing
    uers which are the staff of given activities.
    """

    @model_validator(mode="before")
    def check_foreign_keys(cls: "ActivityStaffBase", values: dict[str, Any]) -> dict[str, Any]:
        """Model validation.

        This model validation function runs before any activity staff is created.

        raises:
            ValueError: If the input data is not valid.
        """

        session: Session = cast(Session, values.get("session"))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        # Validate staff id
        staff_id = values.get("staff_id")
        if staff_id and not session.query(User).filter(User.id == staff_id).first():
            raise ValueError(f"Staff (User) with id {staff_id} does not exist.")

        # Validate activity id
        activity_id = values.get("activity_id")
        if activity_id and not session.query(Activity).filter(Activity.id == activity_id).first():
            raise ValueError(f"Activity with id {activity_id} does not exist.")

        return values


class ActivityStaffCreate(ActivityStaffBase):
    """The data model for creating an activity staff.
    """

    pass


class ActivityStaffDelete(ActivityStaffBase):
    """The data model for deleting an activity staff.
    """

    def check_primary_keys(cls: "ActivityStaffDelete", session: Session) -> "ActivityStaffDelete":
        """Model validation.

        This model validation function is not marked to run automatically, and must be
        manually called. It expects the session as input in order to validate the keys
        before attempting deletion.

        raises:
            ValueError: If the input data is not valid.
        """

        values = cls.model_dump()

        # Validate ActivityStaff row exists
        staff_id = values.get("staff_id")
        activity_id = values.get("activity_id")
        if (
            staff_id
            and activity_id
            and not session.query(ActivityStaff)
            .filter(
                ActivityStaff.activity_id == activity_id,
                ActivityStaff.staff_id == staff_id,
            )
            .first()
        ):
            raise ValueError(
                f"Relationship between staff (User) {staff_id} and Activity "
                f"{activity_id} does not exist."
            )

        return cls


class WeekGraduateAttributeBase(SQLModel):
    """The base model for a week graduate attribute.

    This base model does not include relationships nor validation, only the identities
    that define what it is to be a WeekGraduateAttributeBase, and is then extended by other
    models. It is also not represented by a table in the database.

    Attributes:
        week_workbook_id: The id of the related week's workbook. In combination with
            week_number defines the primary key of the related week 
        week_number: The number of the related week. In combination with
            week_workbook_id defines the primary key of the related week 
        graduate_attribute_id:
            The id of the related graduate attribute.
    """

    week_workbook_id: uuid.UUID = Field(primary_key=True)
    week_number: int = Field(primary_key=True)
    graduate_attribute_id: uuid.UUID = Field(foreign_key="graduateattribute.id", primary_key=True)


class WeekGraduateAttribute(WeekGraduateAttributeBase, table=True):
    """The table model for a week graduate attribute.

    This is how week graduate attributes are represented in the database.

    A week graduate attribute is a link model between weeks and graduate attributes,
    representing graduate attributes which are assigned to given weeks.
    """

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
        """Model validation.

        This model validation function runs before any week graduate attribute is
        created.

        raises:
            ValueError: If the input data is not valid.
        """

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
    """The data model for creating a week graduate attribute.
    """

    pass


class WeekGraduateAttributeDelete(WeekGraduateAttributeBase):
    """The data model for deleting a week graduate attribute.
    """

    def check_primary_keys(
        cls: "WeekGraduateAttributeDelete", session: Session
    ) -> "WeekGraduateAttributeDelete":
        """Model validation.

        This model validation function is not marked to run automatically, and must be
        manually called. It expects the session as input in order to validate the keys
        before attempting deletion.

        raises:
            ValueError: If the input data is not valid.
        """

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
    """The data and table model for a user.

    Attributes:
        id: The UUID of the user, generated at runtime (*NOT* user-specified).
        name: The name of the user.
        permission_group_id: The id of the related permissions group.
    
    1->N Relationship Attributes:
        permissions_group: The permissions group specified by the permission_group_id.
    
    N->1 Relationship Attributes:
        workbooks_leading: The workbooks this user is course_lead of.
    
    N->M Relationship Attributes:
        workbooks_contributing_to: The workbooks this user is contributing to, linked
            by the WorkbookContributor model.
        responsible_activity: The activities this user is staff of, linked by the
            ActivityStaff model.
    """

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
    """The data and table model for a permissions group.

    Attributes:
        id: The UUID of the permissions group, generated at runtime (*NOT*
            user-specified).
        name: The name of the permissions group.
        
    N->1 Relationship Attributes:
        users: The users which are part of this permissions group.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)

    users: list["User"] = Relationship(back_populates="permissions_group")


class WorkbookBase(SQLModel):
    """The data model for a workbook.

    Attributes:
        start_date: The start date of the workbook.
        end_date: The end date of the workbook.
        course_name: The name of the workbook.
        course_lead_id: The user who is this workbook's course lead.
        learning_platform_id: The learning platform on which this workbook is hosted.
    """

    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_name: str = Field(index=True)
    course_lead_id: uuid.UUID = Field(foreign_key="user.id")
    learning_platform_id: uuid.UUID = Field(foreign_key="learningplatform.id")


class Workbook(WorkbookBase, table=True):
    """The table model for a workbook.

    Attributes:
        id: The UUID of the workbook, generated at runtime (*NOT* user-specified).
        number_of_weeks: The number of weeks contained within this workbook,
            programatically edited (*NOT* exposed to the user).
    
    1->N Relationship Attributes:
        course_lead: The user specified by the course_lead_id.
        learning_platform: The learning platform specified by the learning_platform_id.
    
    N->1 Relationship Attributes:
        weeks: The weeks contained within this workbook.
        activities: The activities contained within the weeks contained within this workbook.
    
    N->M Relationship Attributes:
        contributors: The users contributing to this workbook, linked by the
            WorkbookContributor model.
    """

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
        """Model validation.

        This model validation function runs before any workbook is created.

        raises:
            ValueError: If the input data is not valid.
        """

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


class WorkbookCreate(BaseModel):
    """The data model for creating a workbook.

    The use of this model ensures that sensitive fields are not exposed to the user.

    Attributes:
        start_date: The start date of the new workbook.
        end_date: The end date of the new workbook.
        course_name: The name of the new workbook.
        learning_platform_id: The id of the learning platform associated with the new
            workbook.
    """
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_name: str = Field(index=True)
    learning_platform_id: uuid.UUID = Field(foreign_key="learningplatform.id")


class WorkbookUpdate(BaseModel):
    """The data model for updating a workbook.

    The use of this model ensures that sensitive fields are not exposed to the user.

    Attributes:
        start_date: The new start date of the workbook.
        end_date: The new end date of the workbook.
        course_name: The new name of the workbook.
        course_lead_id: The id of the new course lead of the workbook.
    """
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    course_name: Optional[str] = None
    course_lead_id: Optional[uuid.UUID] = None


class LearningPlatform(SQLModel, table=True):
    """The data and table model for a learning platform.

    Attributes:
        id: The UUID of the learning platform, generated at runtime (*NOT*
            user-specified).
        name: The name of the learning platform.
        
    N->1 Relationship Attributes:
        workbooks: The workbooks that are associated with this learning platform.
        learning_activities: The learning activities available on this learning
            platform.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    workbooks: list["Workbook"] = Relationship(back_populates="learning_platform")
    learning_activities: list["LearningActivity"] = Relationship(
        back_populates="learning_platform"
    )


class LearningActivity(SQLModel, table=True):
    """The data and table model for a learning activity.

    Attributes:
        id: The UUID of the learning activity, generated at runtime (*NOT*
            user-specified).
        name: The name of the learning activity.
        learning_platform_id: The id of the related learning platform.
    
    1->N Relationship Attributes:
        learning_platform: The learning platform specified by the learning_platform_id.
    
    N->1 Relationship Attributes:
        activities: The specific activities which are categorised as this learning
            activity.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)
    learning_platform_id: uuid.UUID = Field(foreign_key="learningplatform.id")

    learning_platform: Optional["LearningPlatform"] = Relationship(
        back_populates="learning_activities"
    )

    activities: list["Activity"] = Relationship(back_populates="learning_activity")


class WeekBase(SQLModel):
    """The data model for a week.

    Attributes:
        workbook_id: The id of the workbook which contains this week.
    """

    workbook_id: uuid.UUID = Field(foreign_key="workbook.id", primary_key=True)


class Week(WeekBase, table=True):
    """The table model for a week.

    Attributes:
        number: The number of the week, programatically edited (*NOT* exposed to the
            user). Creates the primary key of the week in combination with workbook_id.
    
    1->N Relationship Attributes:
        workbook: The workbook specified by workbook_id.
    
    N->1 Relationship Attributes:
        activities: The activities contained within this week.
    
    N->M Relationship Attributes:
        graduate_attributes: The graduate attributes associated with this week, linked
            by the WeekGraduateAttribute.
    """

    number: Optional[int] = Field(primary_key=True, default=0)

    workbook: Optional["Workbook"] = Relationship(back_populates="weeks")

    activities: list["Activity"] = Relationship(back_populates="week")

    graduate_attributes: list["GraduateAttribute"] = Relationship(
        back_populates="weeks", link_model=WeekGraduateAttribute
    )

    @model_validator(mode="before")
    def check_foreign_keys(cls: "WeekBase", values: dict[str, Any]) -> dict[str, Any]:
        """Model validation.

        This model validation function runs before any workbook is created.

        raises:
            ValueError: If the input data is not valid.
        """

        session: Session = cast(Session, values.get("session"))

        if session is None:
            raise ValueError("Session is required for foreign key validation")

        # Validate Workbook ID
        workbook_id = values.get("workbook_id")
        if workbook_id and not session.query(Workbook).filter(Workbook.id == workbook_id).first():
            raise ValueError(f"Workbook with id {workbook_id} does not exist.")

        return values


class WeekCreate(WeekBase):
    """The data model for creating a week.
    """

    pass


class WeekDelete(SQLModel):
    """The data model for deleting a week.

    Attributes:
        workbook_id: The id of the workbook containing this week.
        number: The week's number within it's workbook.
    """

    workbook_id: uuid.UUID
    number: int

    def check_primary_keys(cls: "WeekDelete", session: Session) -> "WeekDelete":
        """Model validation.

        This model validation function is not marked to run automatically, and must be
        manually called. It expects the session as input in order to validate the keys
        before attempting deletion.

        raises:
            ValueError: If the input data is not valid.
        """

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
    """The data and table model for a graduate attribute.

    Attributes:
        id: The UUID of the graduate attribute, generated at runtime (*NOT* user-specified).
        name: The name of the graduate attribute.
    
    N->M Relationship Attributes:
        weeks: The weeks which are associated with this graduate attribute, linked by
            the WeekGraduateAttribute model.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    weeks: list["Week"] = Relationship(
        back_populates="graduate_attributes", link_model=WeekGraduateAttribute
    )


class Location(SQLModel, table=True):
    """The data and table model for a location.

    Attributes:
        id: The UUID of the location, generated at runtime (*NOT* user-specified).
        name: The name of the location.

    N->1 Relationship Attributes:
        activities: The activities that are held at this location.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="location")


class ActivityBase(SQLModel):
    """The data model for an activity.

    Attributes:
        workbook_id: The id of the workbook which contains this activity.
        week_number: The number of the week which contains this activity.
        name: The name of the activity.
        time_estimate_minutes: The amount of minutes this activity should take.
        location_id: The location in which this activity will take place.
        learning_activity_id: The related learning activity of this activity.
        learning_type_id: The related learning type of this activity.
        task_status_id: The related task status of this activity.
    """

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
    """The table model for an activity.

    Attributes:
        id: The UUID of the activity, generated at runtime (*NOT* exposed to the user).
        number: The number of the activity, programatically edited (*NOT* exposed to
            the user). Creates the primary key of the week in combination with
            workbook_id.
    
    1->N Relationship Attributes:
        location: The location specified by location_id.
        workbook: The workbook specified by workbook_id.
        week: The week specified by workbook_id and week_number.
        learning_activity: The learning activity specified by learning_activity_id.
        learning_type: The learning type specified by learning_type_id.
        task_status: The task status specified by task_status_id.
    
    N->M Relationship Attributes:
        staff_responsible: The staff which are responsible for this activity, linked by
            the ActivityStaff model.
    """
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
        """Model validation.

        This model validation function runs before any activity is created.

        raises:
            ValueError: If the input data is not valid.
        """

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
    """The data model for creating an activity.
    """

    pass


class ActivityUpdate(BaseModel):
    """The data model for updating an activity.

    The use of this model ensures that sensitive fields are not exposed to the user.

    Attributes:
        name: The new name of the activity.
        number: The new number of the activity.
        time_estimate_minutes: The new time_estimate_minutes of the activity.
        location_id: The id of the new location of the activity.
        learning_activity_id: The id of the new learning activity related to this
            activity.
        learning_type_id: The id of the new learning type associated with this
            activity.
        task_status_id: The id of the task status associated with this activity.
    """

    name: Optional[str] = None
    number: Optional[int] = None
    time_estimate_minutes: Optional[int] = None
    location_id: Optional[uuid.UUID] = None
    learning_activity_id: Optional[uuid.UUID] = None
    learning_type_id: Optional[uuid.UUID] = None
    task_status_id: Optional[uuid.UUID] = None


class LearningType(SQLModel, table=True):
    """The data and table model for a learning type.

    Attributes:
        id: The UUID of the learning type, generated at runtime (*NOT* user-specified).
        name: The name of the learning type.
        
    N->1 Relationship Attributes:
        activities: The activities that associate with this learning type.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="learning_type")


class TaskStatus(SQLModel, table=True):
    """The data and table model for a task status.

    Attributes:
        id: The UUID of the task status, generated at runtime (*NOT* user-specified).
        name: The name of the task status.
        
    N->1 Relationship Attributes:
        activities: The activities that associate with this task status.
    """

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(nullable=False)

    activities: list["Activity"] = Relationship(back_populates="task_status")
