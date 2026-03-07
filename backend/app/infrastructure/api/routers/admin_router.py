"""
Admin-only routes: list users, list all events, stats, reports.
Requires RequireAdmin dependency.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.domain.entities.user import User
from app.infrastructure.api.controllers.admin_controller import AdminController
from app.infrastructure.api.controllers.event_controller import EventController
from app.infrastructure.api.controllers.registration_controller import (
    RegistrationController,
)
from app.infrastructure.api.dependencies.provider import (
    RequireAdmin,
    get_admin_controller,
    get_event_controller,
    get_registration_controller,
)
from app.infrastructure.api.mappers.event_mapper import event_to_response_dict
from app.infrastructure.api.routers.event_router import EventResponse
from app.infrastructure.api.schemas.error_response import ErrorResponse
from pydantic import BaseModel, Field

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        403: {"model": ErrorResponse, "description": "Forbidden: Admin only"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"},
    },
)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime


class PaginatedUsersResponse(BaseModel):
    items: list[UserResponse]
    total: int
    skip: int
    limit: int


class AdminStatsResponse(BaseModel):
    total_users: int
    total_events: int
    events_by_status: dict[str, int]


class AdminEventResponse(EventResponse):
    """Event with organizer email and full_name (single query)."""
    organizer_email: str
    organizer_full_name: str


class PaginatedAdminEventsResponse(BaseModel):
    items: list[AdminEventResponse]
    total: int
    skip: int
    limit: int


def _user_to_response(user: User) -> UserResponse:
    role_str = getattr(user.role, "value", user.role) if user.role else ""
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role_str,
        created_at=user.created_at,
    )


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get user by id (admin)",
    responses={404: {"model": ErrorResponse, "description": "User not found"}},
)
def get_user(
    user_id: int,
    controller: AdminController = Depends(get_admin_controller),
    _: User = Depends(RequireAdmin),
):
    user = controller.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_response(user)


@router.get(
    "/users",
    response_model=PaginatedUsersResponse,
    summary="List all users (admin)",
)
def list_users(
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    role: str | None = None,
    controller: AdminController = Depends(get_admin_controller),
    _: User = Depends(RequireAdmin),
):
    users, total = controller.list_users(skip=skip, limit=limit, search=search, role=role)
    return {
        "items": [_user_to_response(u) for u in users],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Dashboard statistics (admin)",
)
def get_stats(
    controller: AdminController = Depends(get_admin_controller),
    _: User = Depends(RequireAdmin),
):
    return controller.get_stats()


class TopAttendeeResponse(BaseModel):
    user_id: int = Field(..., description="User ID")
    full_name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email")
    registration_count: int = Field(..., description="Number of event registrations")


class PaginatedTopAttendeesResponse(BaseModel):
    items: list[TopAttendeeResponse]
    total: int
    skip: int
    limit: int


@router.get(
    "/reports/top-attendees",
    response_model=PaginatedTopAttendeesResponse,
    summary="Top users by registration count (admin report, paginated)",
)
def get_top_attendees(
    skip: int = 0,
    limit: int = 5,
    search: str | None = None,
    controller: AdminController = Depends(get_admin_controller),
    _: User = Depends(RequireAdmin),
):
    rows, total = controller.get_top_attendees(skip=skip, limit=limit, search=search)
    return PaginatedTopAttendeesResponse(
        items=[
            TopAttendeeResponse(
                user_id=uid, full_name=name, email=email, registration_count=count
            )
            for uid, name, email, count in rows
        ],
        total=total,
        skip=skip,
        limit=limit,
    )


class PaginatedUpcomingEventsResponse(BaseModel):
    items: list[EventResponse]
    total: int
    skip: int
    limit: int


@router.get(
    "/reports/upcoming-events",
    response_model=PaginatedUpcomingEventsResponse,
    summary="Upcoming published events (admin report, paginated)",
)
def get_upcoming_events(
    skip: int = 0,
    limit: int = 5,
    search: str | None = None,
    controller: AdminController = Depends(get_admin_controller),
    _: User = Depends(RequireAdmin),
):
    events, total = controller.get_upcoming_events(
        skip=skip, limit=limit, search=search
    )
    return PaginatedUpcomingEventsResponse(
        items=[event_to_response_dict(e) for e in events],
        total=total,
        skip=skip,
        limit=limit,
    )


class PaginatedUserRegisteredEventsResponse(BaseModel):
    items: list[EventResponse]
    total: int
    skip: int
    limit: int


@router.get(
    "/users/{user_id}/registered-events",
    response_model=PaginatedUserRegisteredEventsResponse,
    summary="List events a user is registered for (admin, paginated)",
)
def get_user_registered_events_admin(
    user_id: int,
    skip: int = 0,
    limit: int = 5,
    search: str | None = None,
    registration_controller: RegistrationController = Depends(
        get_registration_controller
    ),
    _: User = Depends(RequireAdmin),
):
    """Admin-only: events the given user is registered to attend (paginated, search by title)."""
    events, total = registration_controller.get_user_registered_events_paginated(
        user_id, skip=skip, limit=limit, search=search
    )
    if not events:
        return PaginatedUserRegisteredEventsResponse(
            items=[], total=0, skip=skip, limit=limit
        )
    event_ids = [e.id for e in events]
    counts = registration_controller.get_registration_counts_for_events(event_ids)
    items = [
        event_to_response_dict(e, registered_count=counts.get(e.id)) for e in events
    ]
    return PaginatedUserRegisteredEventsResponse(
        items=items, total=total, skip=skip, limit=limit
    )


@router.get(
    "/events",
    response_model=PaginatedAdminEventsResponse,
    summary="List all events (admin, any status) with organizer email/name",
)
def list_all_events(
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    status: str | None = None,
    organizer_id: int | None = None,
    event_controller: EventController = Depends(get_event_controller),
    _: User = Depends(RequireAdmin),
):
    """List all events with organizer email and full_name. Filter by organizer_id if given."""
    rows, total = event_controller.list_events_with_organizer(
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        organizer_id=organizer_id,
    )
    items = [
        {
            **event_to_response_dict(row.event),
            "organizer_email": row.organizer_email,
            "organizer_full_name": row.organizer_full_name,
        }
        for row in rows
    ]
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }
