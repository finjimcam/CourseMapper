from typing import Any, Dict, List
from sqlmodel import select
from models.models_base import User, LearningPlatform, Workbook
from sqlmodel import Session


def add_workbook_details(session: Session, workbook: Workbook) -> Dict[str, Any]:
    # Fetch related data
    course_lead = session.exec(select(User).where(User.id == workbook.course_lead_id)).first()
    learning_platform = session.exec(
        select(LearningPlatform).where(LearningPlatform.id == workbook.learning_platform_id)
    ).first()

    # Build response
    response: Dict[str, Any] = {
        "workbook": {
            "id": str(workbook.id),
            "start_date": workbook.start_date.isoformat(),
            "end_date": workbook.end_date.isoformat(),
            "course_name": workbook.course_name,
            "course_lead_id": str(workbook.course_lead_id),
            "learning_platform_id": str(workbook.learning_platform_id),
        },
        "course_lead": (
            {
                "id": str(course_lead.id),
                "name": course_lead.name,
            }
            if course_lead
            else None
        ),
        "learning_platform": (
            {
                "id": str(learning_platform.id),
                "name": learning_platform.name,
            }
            if learning_platform
            else None
        ),
        "activities": [],
    }

    return response
