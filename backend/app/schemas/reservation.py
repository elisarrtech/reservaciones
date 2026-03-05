from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.reservation import PaymentStatus


class ReservationBase(BaseModel):
    guest_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)
    check_in_date: date
    check_out_date: date
    arrival_time: time | None = None
    guest_count: int = Field(default=1, ge=1, le=20)
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    total_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self) -> "ReservationBase":
        if self.check_out_date <= self.check_in_date:
            raise ValueError("check_out_date must be after check_in_date")
        return self


class ReservationCreate(ReservationBase):
    pass


class ReservationUpdate(BaseModel):
    guest_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    check_in_date: date | None = None
    check_out_date: date | None = None
    arrival_time: time | None = None
    guest_count: int | None = Field(default=None, ge=1, le=20)
    payment_status: PaymentStatus | None = None
    total_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_dates(self) -> "ReservationUpdate":
        if (
            self.check_in_date is not None
            and self.check_out_date is not None
            and self.check_out_date <= self.check_in_date
        ):
            raise ValueError("check_out_date must be after check_in_date")
        return self


class ReservationRead(ReservationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

