import hashlib
import json
import re
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any


class ChecklistNotFoundError(FileNotFoundError):
    """Raised when a canonical checklist has not been generated yet."""


class ChecklistStore:
    """Small JSON-backed store for the prototype's canonical task checklist."""

    def __init__(self, root: Path | None = None) -> None:
        backend_root = Path(__file__).resolve().parents[2]
        self.root = root or backend_root / "data" / "generated" / "checklists"

    @staticmethod
    def _filename(lab_id: str, version: int) -> str:
        safe_lab_id = re.sub(r"[^a-zA-Z0-9._-]+", "-", lab_id).strip("-._") or "lab"
        digest = hashlib.sha256(lab_id.encode("utf-8")).hexdigest()[:10]
        return f"{safe_lab_id}--{digest}--v{version}.json"

    def path_for(self, lab_id: str, version: int) -> Path:
        return self.root / self._filename(lab_id, version)

    def save(self, checklist: dict[str, Any]) -> Path:
        lab_id = str(checklist["lab_id"])
        version = int(checklist["lab_version"])
        target = self.path_for(lab_id, version)
        target.parent.mkdir(parents=True, exist_ok=True)

        # Replace atomically so another endpoint never reads a half-written JSON file.
        with NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=target.parent,
            prefix=f".{target.stem}-",
            suffix=".tmp",
            delete=False,
        ) as handle:
            json.dump(checklist, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
            temporary = Path(handle.name)
        temporary.replace(target)
        return target

    def load(self, lab_id: str, version: int) -> dict[str, Any]:
        source = self.path_for(lab_id, version)
        if not source.is_file():
            raise ChecklistNotFoundError(
                f"Chưa có checklist đã phân tích cho lab_id={lab_id!r}, version={version}."
            )
        with source.open(encoding="utf-8") as handle:
            return json.load(handle)
