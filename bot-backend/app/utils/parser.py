import json
import re
from typing import Any

DATA_CAPTURE_RE = re.compile(r"DATA_CAPTURE:\s*(\{.*?\})\s*$", re.DOTALL)


def parse_ai_response(raw: str) -> tuple[str, dict[str, Any]]:
    match = DATA_CAPTURE_RE.search(raw.strip())
    if not match:
        return raw.strip(), {}

    clean_text = DATA_CAPTURE_RE.sub("", raw.strip()).strip()
    try:
        captured = json.loads(match.group(1))
    except json.JSONDecodeError:
        captured = {}
    return clean_text, captured
