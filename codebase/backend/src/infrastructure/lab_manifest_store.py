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

    def get(self, lab_id: str | None, version: int = 1) -> dict[str, Any] | None:
        """Find manifest matching specific lab_id (case-insensitive & dash-tolerant) or return None."""
        if not self.root.is_dir():
            return None

        if not lab_id:
            return self.load_any_or_first(version=version)

        clean_target = (
            str(lab_id)
            .replace("\u2013", "-")
            .replace("\u2014", "-")
            .strip()
            .casefold()
        )
        for source in sorted(self.root.glob("*.json")):
            with source.open(encoding="utf-8") as handle:
                payload = json.load(handle)
            current_id = (
                str(payload.get("lab_id", ""))
                .replace("\u2013", "-")
                .replace("\u2014", "-")
                .strip()
                .casefold()
            )
            if (
                current_id == clean_target
                or clean_target.startswith(current_id)
                or current_id.startswith(clean_target)
                or clean_target in current_id
                or current_id in clean_target
            ):
                return LabManifest.model_validate(payload).model_dump(mode="json")

        return self.load_any_or_first(version=version)

    def load_any_or_first(
        self, lab_id: str | None = None, version: int = 1
    ) -> dict[str, Any] | None:
        """Find manifest matching lab_id and version, or fallback to the first available JSON."""
        if not self.root.is_dir():
            return None
        files = sorted(self.root.glob("*.json"))
        if files:
            with files[0].open(encoding="utf-8") as handle:
                payload = json.load(handle)
            return LabManifest.model_validate(payload).model_dump(mode="json")
        return None
