"""Client for the Ticketmaster Discovery API.

Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

import requests
from django.conf import settings


_BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

# Maps our internal area slugs to Ticketmaster search params.
_AREA_PARAMS: dict[str, dict[str, str]] = {
    "seattle": {"city": "Seattle", "stateCode": "WA"},
    "bellevue": {"city": "Bellevue", "stateCode": "WA"},
    "redmond": {"city": "Redmond", "stateCode": "WA"},
    "king-county": {"stateCode": "WA", "dmaId": "819"},
}


class TicketmasterError(Exception):
    pass


def _normalize(event: dict) -> dict:
    """Map a Ticketmaster event payload to our shared event shape."""
    dates = event.get("dates") or {}
    start = dates.get("start") or {}
    date_str = start.get("dateTime") or start.get("localDate") or ""
    if date_str and "T" not in date_str:
        date_str = f"{date_str}T00:00:00"

    venues = (event.get("_embedded") or {}).get("venues") or []
    venue = venues[0] if venues else {}
    city = (venue.get("city") or {}).get("name") or ""
    address_line = (venue.get("address") or {}).get("line1") or ""
    venue_name = venue.get("name") or ""
    address_parts = [p for p in (venue_name, address_line, city) if p]
    address = ", ".join(address_parts)

    classifications = event.get("classifications") or []
    category = ""
    if classifications:
        segment = (classifications[0].get("segment") or {}).get("name") or ""
        genre = (classifications[0].get("genre") or {}).get("name") or ""
        category = " / ".join(p for p in (segment, genre) if p)

    description = event.get("info") or event.get("pleaseNote") or ""

    return {
        "external_id": f"tm-{event.get('id', '')}",
        "source_api": "ticketmaster",
        "title": event.get("name") or "",
        "category": category,
        "description": description,
        "location_address": address,
        "date": date_str,
        "url": event.get("url") or "",
    }


def search_events(
    area: str | None = None,
    query: str | None = None,
    limit: int = 500,
    days_ahead: int = 60,
) -> list[dict]:
    """Search Ticketmaster Discovery for upcoming events in the given area.

    Paginates through the results so we can span the full `days_ahead` window —
    a single page (max 200 events) only covers ~2 weeks in a busy market like
    Seattle. Returns an empty list if no API key is configured so callers can
    treat Ticketmaster as an optional supplement.
    """
    api_key = getattr(settings, "TICKETMASTER_API_KEY", "") or ""
    if not api_key:
        return []

    capped_limit = max(1, int(limit))
    page_size = 200
    today = date.today()
    end_date = today + timedelta(days=max(1, int(days_ahead)))

    base_params: dict[str, str | int] = {
        "apikey": api_key,
        "size": page_size,
        "sort": "date,asc",
        "startDateTime": datetime.combine(today, datetime.min.time()).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endDateTime": datetime.combine(end_date, datetime.min.time()).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    area_params = _AREA_PARAMS.get((area or "").lower())
    if area_params:
        base_params.update(area_params)

    if query:
        base_params["keyword"] = query

    collected: list[dict] = []
    # Ticketmaster's deep-paging limit is (size * page) <= 1000, so cap pages accordingly.
    max_pages = min(5, (capped_limit + page_size - 1) // page_size)
    for page in range(max_pages):
        params = {**base_params, "page": page}
        try:
            resp = requests.get(_BASE_URL, params=params, timeout=10)
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise TicketmasterError(str(exc)) from exc

        payload = resp.json()
        events = ((payload.get("_embedded") or {}).get("events")) or []
        if not events:
            break
        collected.extend(_normalize(ev) for ev in events)

        page_info = payload.get("page") or {}
        total_pages = int(page_info.get("totalPages") or 0)
        if page + 1 >= total_pages:
            break
        if len(collected) >= capped_limit:
            break

    return collected[:capped_limit]
