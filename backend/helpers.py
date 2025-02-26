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

This module contains helper functions used by main.py.

It functions as a separation of concerns to ensure main.py stays focused on the API
definition and implementation.
"""

from typing import Any, Dict, List
from sqlmodel import select, Session
from models.models_base import User, LearningPlatform, Workbook


def add_workbook_details(session: Session, workbook: Workbook) -> Dict[str, Any]:
    """Enriches a workbook model with details hidden in its fields.

    This injects some additional data into the workbook model returned, allowing for
    all relevant information in workbook display to be returned in one request,
    reducing duplicated work and logic on the frontend.
    
    Used in get_workbook_details hook in main.py.
    """
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
