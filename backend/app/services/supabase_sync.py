import httpx

from app.core.config import settings


class SupabaseSyncError(Exception):
    pass


def supabase_enabled() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_role_key)


def sync_profile(user) -> dict:
    if not supabase_enabled():
        return {"enabled": False, "synced": False, "reason": "Supabase not configured"}

    endpoint = f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles"
    payload = {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "preferred_theme": user.preferred_theme,
        "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
    }
    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    try:
        response = httpx.post(
            endpoint,
            json=payload,
            headers=headers,
            params={"on_conflict": "id"},
            timeout=settings.supabase_timeout_seconds,
        )
    except httpx.HTTPError as exc:
        raise SupabaseSyncError("Unable to connect to Supabase") from exc

    if response.status_code >= 400:
        raise SupabaseSyncError(f"Supabase sync failed ({response.status_code})")

    return {"enabled": True, "synced": True}
