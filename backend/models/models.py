import datetime
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int = Field(nullable=False, primary_key=True)
    name: str = Field(index=True)
    permissions_group_id: int = Field(foreign_key="permissionsgroup.id")


class PermissionsGroup(SQLModel, table=True):
    id: int = Field(nullable=False, primary_key=True)
    name: str = Field(index=True)


class Workbook(SQLModel, table=True):
    id: int = Field(nullable=False, primary_key=True)
    start_date: datetime.date = Field(nullable=False)
    end_date: datetime.date = Field(nullable=False)
    course_lead_id: int = Field(foreign_key="user.id")
    related_course_id: int = Field(foreign_key="course.id")


class WorkbookContributors(SQLModel, table=True):
    contributor_id: int = Field(foreign_key="user.id", primary_key=True)
    workbook_id: int = Field(foreign_key="workbook.id", primary_key=True)


class Course(SQLModel, table=True):
    id: int = Field(nullable=False, primary_key=True)
    course_code: str = Field(nullable=False)
    name: str = Field(nullable=False)
