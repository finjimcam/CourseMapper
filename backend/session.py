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

This module provides functionality required for managing authentication sessions.
"""

import uuid
from pydantic import BaseModel
from fastapi import HTTPException
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.session_verifier import SessionVerifier


# Special session model
class SessionData(BaseModel):
    """The data stored in the session cookie."""

    user_id: uuid.UUID


class BaseVerifier(SessionVerifier[uuid.UUID, SessionData]):  # type: ignore[misc]
    """The session verifier used by FastAPI on our sessions."""

    def __init__(
        self,
        *,
        identifier: str,
        auto_error: bool,
        backend: InMemoryBackend[uuid.UUID, SessionData],
        auth_http_exception: HTTPException,
    ):
        self._identifier = identifier
        self._auto_error = auto_error
        self._backend = backend
        self._auth_http_exception = auth_http_exception

    @property
    def identifier(self) -> str:
        return self._identifier

    @property
    def backend(self) -> InMemoryBackend:
        return self._backend

    @property
    def auto_error(self) -> bool:
        return self._auto_error

    @property
    def auth_http_exception(self) -> HTTPException:
        return self._auth_http_exception

    def verify_session(self, _: SessionData) -> bool:
        # If the session exists, it is valid
        return True
