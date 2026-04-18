"""Client for Seattle's Socrata open data portal (data.seattle.gov).

Uses the SoQL query interface documented at
https://dev.socrata.com/docs/queries/ to search civic event datasets.
"""
from __future__ import annotations

import requests
from django.conf import settings


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
    title = row.get("event_name") or row.get("name_of_event") or row.get("name") or ""
    description = row.get("event_description") or row.get("description") or ""
    category = row.get("event_category") or row.get("category") or row.get("type_of_event") or ""
    address = (
        row.get("event_address")
        or row.get("event_location")
        or row.get("location")
        or row.get("address")
        or ""
    )
    date = row.get("event_start_date") or row.get("start_date") or row.get("date") or ""
    external_id = row.get(":id") or row.get("permit_number") or row.get("id") or ""
    return {
        "external_id": str(external_id),
        "source_api": "seattle_socrata",
        "title": title,
        "category": category,
        "description": description,
        "location_address": address,
        "date": date,
    }


def search_events(query: str | None = None, limit: int = 25) -> list[dict]:
    """Search the configured Seattle dataset for events.

    `query` does a case-insensitive full-text search via Socrata's `$q`.
    """
    params: dict[str, str | int] = {"$limit": max(1, min(int(limit), 1000))}
    if query:
        params["$q"] = query

    try:
        resp = requests.get(_resource_url(), params=params, headers=_headers(), timeout=10)
        resp.raise_for_status()
    except requests.RequestException as exc:
        raise SocrataError(str(exc)) from exc

    rows = resp.json()
    if not isinstance(rows, list):
        raise SocrataError("Unexpected Socrata response shape")
    return [_normalize(row) for row in rows]
