import json
from pathlib import Path
from typing import Any

from src.models.lab import LabManifest


class LabManifestNotFoundError(FileNotFoundError):
    """Raised when no bundled JSON manifest matches a LAB id and version."""


class LabManifestStore:
    """Read validated LAB manifests from the backend's bundled JSON directory."""

    def __init__(self, root: Path | None = None) -> None:
        backend_root = Path(__file__).resolve().parents[2]
        self.root = root or backend_root / "data" / "labs"

    def load(self, lab_id: str, version: int) -> dict[str, Any]:
        if not self.root.is_dir():
            raise LabManifestNotFoundError(
                f"Không tìm thấy thư mục dữ liệu LAB: {self.root}."
            )

        for source in sorted(self.root.glob("*.json")):
            with source.open(encoding="utf-8") as handle:
                payload = json.load(handle)
            if payload.get("lab_id") == lab_id and payload.get("version") == version:
                return LabManifest.model_validate(payload).model_dump(mode="json")

        raise LabManifestNotFoundError(
            f"Không có dữ liệu JSON cho lab_id={lab_id!r}, version={version}."
        )
