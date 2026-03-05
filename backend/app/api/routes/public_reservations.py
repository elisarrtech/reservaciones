from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.reservation import Reservation
from app.schemas.reservation import ReservationCreate, ReservationRead
from app.services.google_drive_sync import GoogleDriveSyncService, get_google_drive_sync_service

router = APIRouter(prefix="/public/reservations", tags=["public-reservations"])


@router.post("", response_model=ReservationRead, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    payload: ReservationCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
    sync_service: GoogleDriveSyncService = Depends(get_google_drive_sync_service),
) -> Reservation:
    reservation = Reservation(**payload.model_dump())
    session.add(reservation)
    await session.commit()
    await session.refresh(reservation)
    background_tasks.add_task(sync_service.sync_reservations_snapshot)
    return reservation


@router.get("/{reservation_id}", response_model=ReservationRead)
async def get_reservation(
    reservation_id: int,
    session: AsyncSession = Depends(get_db_session),
) -> Reservation:
    result = await session.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    return reservation

