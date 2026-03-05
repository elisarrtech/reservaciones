import asyncio
import base64
import csv
import io
import json
import logging
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import get_settings
from app.db.session import async_session_factory
from app.models.reservation import Reservation

logger = logging.getLogger(__name__)
DRIVE_SCOPE = ["https://www.googleapis.com/auth/drive.file"]


class GoogleDriveSyncService:
    def __init__(self, session_factory: async_sessionmaker):
        self._session_factory = session_factory
        self._settings = get_settings()

    async def sync_reservations_snapshot(self) -> None:
        if not self._settings.google_drive_enabled:
            return
        if (
            not self._settings.google_service_account_json
            or not self._settings.google_drive_folder_id
        ):
            logger.warning(
                "Google Drive sync is enabled but credentials/folder are missing."
            )
            return

        try:
            async with self._session_factory() as session:
                result = await session.execute(
                    select(Reservation).order_by(Reservation.created_at.desc())
                )
                reservations = list(result.scalars().all())

            csv_payload = self._build_csv_payload(reservations)
            await asyncio.to_thread(self._upload_csv_payload, csv_payload)
        except Exception:
            logger.exception("Google Drive sync failed.")

    def _build_csv_payload(self, reservations: list[Reservation]) -> bytes:
        columns = [
            "id",
            "guest_name",
            "email",
            "phone",
            "check_in_date",
            "check_out_date",
            "arrival_time",
            "guest_count",
            "payment_status",
            "total_amount",
            "notes",
            "created_at",
            "updated_at",
        ]
        stream = io.StringIO()
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()

        for reservation in reservations:
            writer.writerow(
                {
                    "id": reservation.id,
                    "guest_name": reservation.guest_name,
                    "email": reservation.email,
                    "phone": reservation.phone or "",
                    "check_in_date": self._serialize(reservation.check_in_date),
                    "check_out_date": self._serialize(reservation.check_out_date),
                    "arrival_time": self._serialize(reservation.arrival_time),
                    "guest_count": reservation.guest_count,
                    "payment_status": reservation.payment_status.value,
                    "total_amount": self._serialize(reservation.total_amount),
                    "notes": reservation.notes or "",
                    "created_at": self._serialize(reservation.created_at),
                    "updated_at": self._serialize(reservation.updated_at),
                }
            )

        return stream.getvalue().encode("utf-8")

    def _upload_csv_payload(self, payload: bytes) -> None:
        settings = self._settings
        service_account_info = self._load_service_account_info(
            settings.google_service_account_json or ""
        )
        credentials = service_account.Credentials.from_service_account_info(
            service_account_info,
            scopes=DRIVE_SCOPE,
        )
        drive_service = build(
            "drive",
            "v3",
            credentials=credentials,
            cache_discovery=False,
        )

        file_name = settings.google_drive_file_name.replace("'", "\\'")
        folder_id = (settings.google_drive_folder_id or "").replace("'", "\\'")
        query = (
            f"name = '{file_name}' and '{folder_id}' in parents and trashed = false"
        )
        existing_files = (
            drive_service.files()
            .list(q=query, fields="files(id,name)", pageSize=1)
            .execute()
            .get("files", [])
        )

        media = MediaIoBaseUpload(
            io.BytesIO(payload),
            mimetype="text/csv",
            resumable=False,
        )

        if existing_files:
            file_id = existing_files[0]["id"]
            drive_service.files().update(fileId=file_id, media_body=media).execute()
            return

        metadata = {
            "name": settings.google_drive_file_name,
            "parents": [settings.google_drive_folder_id],
        }
        drive_service.files().create(
            body=metadata,
            media_body=media,
            fields="id",
        ).execute()

    @staticmethod
    def _load_service_account_info(raw_value: str) -> dict[str, Any]:
        value = raw_value.strip()
        if value.startswith("{"):
            return json.loads(value)
        decoded = base64.b64decode(value).decode("utf-8")
        return json.loads(decoded)

    @staticmethod
    def _serialize(value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, Decimal):
            return f"{value:.2f}"
        if isinstance(value, (datetime, date, time)):
            return value.isoformat()
        return str(value)


google_drive_sync_service = GoogleDriveSyncService(async_session_factory)


def get_google_drive_sync_service() -> GoogleDriveSyncService:
    return google_drive_sync_service

