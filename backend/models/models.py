import datetime
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(index=True)
    permissions_group_id: int = Field(foreign_key="permissionsgroup.id")


class PermissionsGroup(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(index=True)


class Workbook(SQLModel, table=True):
    id: int = Field(primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_lead_id: int = Field(foreign_key="user.id")
    course_id: int = Field(foreign_key="course.id")
    learning_platform_id: int = Field(foreign_key="learningplatform.id")


class WorkbookContributors(SQLModel, table=True):
    contributor_id: int = Field(foreign_key="user.id", primary_key=True)
    workbook_id: int = Field(foreign_key="workbook.id", primary_key=True)


class Course(SQLModel, table=True):
    id: int = Field(primary_key=True)
    course_code: str = Field(nullable=False)
    name: str = Field(nullable=False)


class LearningPlatform(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(nullable=False)


class LearningActivity(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(nullable=False)
    learning_platform_id: int = Field(foreign_key="learningplatform.id")


class Week(SQLModel, table=True):
    workbook_id: int = Field(foreign_key="workbook.id", primary_key=True)
    number: int = Field(primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)


class Activity(SQLModel, table=True):
    workbook_id: int = Field(foreign_key="workbook.id", primary_key=True)
    week_number: int = Field(foreign_key="week.number", primary_key=True)
    name: str = Field(nullable=False)
    time_estimate_minutes: int = Field(nullable=False)
    location: str = Field(nullable=False)
    learning_activity_id: int = Field(nullable=False, foreign_key="learningactivity.id")
    learning_type_id: int = Field(nullable=False, foreign_key="learningtype.id")
    task_status_id: int = Field(nullable=False, foreign_key="taskstatus.id")


class ActivityStaff(SQLModel, table=True):
    staff_id: int = Field(foreign_key="user.id", primary_key=True)
    activity_workbook_id: int = Field(foreign_key="workbook.id", primary_key=True)
    activity_week_number: int = Field(foreign_key="week.number", primary_key=True)


class LearningType(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(nullable=False)


class TaskStatus(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(nullable=False)
