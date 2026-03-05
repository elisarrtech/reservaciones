from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_admin_token
from app.db.session import get_db_session
from app.models.reservation import PaymentStatus, Reservation
from app.schemas.reservation import ReservationRead, ReservationUpdate
from app.services.google_drive_sync import GoogleDriveSyncService, get_google_drive_sync_service

router = APIRouter(
    prefix="/admin/reservations",
    tags=["admin-reservations"],
    dependencies=[Depends(require_admin_token)],
)


@router.get("", response_model=list[ReservationRead])
async def list_reservations(
    payment_status: PaymentStatus | None = Query(default=None),
    check_in_from: date | None = Query(default=None),
    check_in_to: date | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db_session),
) -> list[Reservation]:
    query: Select[tuple[Reservation]] = select(Reservation)

    if payment_status is not None:
        query = query.where(Reservation.payment_status == payment_status)
    if check_in_from is not None:
        query = query.where(Reservation.check_in_date >= check_in_from)
    if check_in_to is not None:
        query = query.where(Reservation.check_in_date <= check_in_to)

    query = query.order_by(Reservation.created_at.desc()).limit(limit).offset(offset)
    result = await session.execute(query)
    return list(result.scalars().all())


@router.patch("/{reservation_id}", response_model=ReservationRead)
async def update_reservation(
    reservation_id: int,
    payload: ReservationUpdate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
    sync_service: GoogleDriveSyncService = Depends(get_google_drive_sync_service),
) -> Reservation:
    result = await session.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "check_in_date" in update_data and "check_out_date" not in update_data:
        if reservation.check_out_date <= update_data["check_in_date"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="check_out_date must be after check_in_date",
            )
    if "check_out_date" in update_data and "check_in_date" not in update_data:
        if update_data["check_out_date"] <= reservation.check_in_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="check_out_date must be after check_in_date",
            )

    for field, value in update_data.items():
        setattr(reservation, field, value)

    await session.commit()
    await session.refresh(reservation)
    background_tasks.add_task(sync_service.sync_reservations_snapshot)
    return reservation


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(
    reservation_id: int,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
    sync_service: GoogleDriveSyncService = Depends(get_google_drive_sync_service),
) -> Response:
    result = await session.execute(
        select(Reservation).where(Reservation.id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    if reservation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")

    await session.delete(reservation)
    await session.commit()
    background_tasks.add_task(sync_service.sync_reservations_snapshot)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

