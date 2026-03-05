from datetime import date, datetime, time
from decimal import Decimal
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SQLAlchemyEnum, Integer, Numeric, String, Text, Time, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaymentStatus(str, Enum):
    PAID = "paid"
    UNPAID = "unpaid"


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    guest_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    check_in_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_out_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    arrival_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SQLAlchemyEnum(PaymentStatus),
        nullable=False,
        default=PaymentStatus.UNPAID,
    )
    total_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

