"""Client for Seattle's Socrata open data portal (data.seattle.gov).

Uses the SoQL query interface documented at
https://dev.socrata.com/docs/queries/ to search civic event datasets.
"""
from __future__ import annotations

from datetime import date

import requests
from django.conf import settings

# Socrata column name on the default dataset (6853-bgsc, Seattle Channel
# TV Schedule). Override via SEATTLE_SOCRATA_DATE_FIELD if you point the
# integration at a dataset that uses a different column.
_DEFAULT_DATE_FIELD = "date"


class SocrataError(Exception):
    pass


def _resource_url() -> str:
    return (
        f"https://{settings.SEATTLE_SOCRATA_DOMAIN}"
        f"/resource/{settings.SEATTLE_SOCRATA_DATASET_ID}.json"
    )


def _headers() -> dict:
    token = settings.SEATTLE_SOCRATA_APP_TOKEN
    return {"X-App-Token": token} if token else {}


def _normalize(row: dict) -> dict:
    """Map a Socrata row to the shape the frontend expects for events.

    Field names vary by dataset. This tries the common columns used on
    data.seattle.gov event datasets and falls back to empty strings.
    """
    title = row.get("title") or row.get("event_name") or row.get("name_of_event") or row.get("name") or ""
    description = row.get("notes") or row.get("event_description") or row.get("description") or ""
    category = row.get("event_category") or row.get("category") or row.get("type_of_event") or ""
    address_val = (
        row.get("event_address")
        or row.get("event_location")
        or row.get("location")
        or row.get("address")
        or ""
    )
    # Socrata "location" fields can be dicts ({type, coordinates}); stringify safely.
    address = address_val if isinstance(address_val, str) else ""
    date = row.get("date") or row.get("event_start_date") or row.get("start_date") or ""
    # Append time-of-day if present (e.g. TV schedule has a separate time column).
    time_of_day = row.get("time")
    if date and time_of_day and "T00:00:00" in date:
        date = f"{date[:10]}T{time_of_day}"
    external_id = row.get(":id") or row.get("msn") or row.get("permit_number") or row.get("id") or ""
    return {
        "external_id": str(external_id),
        "source_api": "seattle_socrata",
        "title": title,
        "category": category,
        "description": description,
        "location_address": address,
        "date": date,
    }


def _fetch(params: dict) -> list[dict]:
    try:
        resp = requests.get(_resource_url(), params=params, headers=_headers(), timeout=10)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise SocrataError(str(exc)) from exc

    rows = resp.json()
    if not isinstance(rows, list):
        raise SocrataError("Unexpected Socrata response shape")
    return rows


def search_events(query: str | None = None, limit: int = 25) -> list[dict]:
    """Search the configured Seattle dataset, preferring upcoming events.

    Queries for events whose date is today or later, ordered soonest first.
    If none match (e.g. the dataset hasn't been updated recently), falls
    back to the most recent past events ordered newest first so the UI
    still has something to show. `query` does a case-insensitive full-text
    search via Socrata's `$q`.
    """
    date_field = getattr(settings, "SEATTLE_SOCRATA_DATE_FIELD", _DEFAULT_DATE_FIELD)
    capped_limit = max(1, min(int(limit), 1000))
    today_iso = date.today().isoformat()

    upcoming_params: dict[str, str | int] = {
        "$limit": capped_limit,
        "$where": f"{date_field} >= '{today_iso}T00:00:00'",
        "$order": f"{date_field} ASC",
    }
    if query:
        upcoming_params["$q"] = query

    rows = _fetch(upcoming_params)
    if not rows:
        fallback_params: dict[str, str | int] = {
            "$limit": capped_limit,
            "$order": f"{date_field} DESC",
        }
        if query:
            fallback_params["$q"] = query
        rows = _fetch(fallback_params)

    return [_normalize(row) for row in rows]
