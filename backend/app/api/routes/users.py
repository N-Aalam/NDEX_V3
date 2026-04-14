from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.crud.user import update_user_profile
from app.schemas.user import UserProfileUpdate, UserPublic
from app.services.supabase_sync import SupabaseSyncError, supabase_enabled, sync_profile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserPublic)
def update_me(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated = update_user_profile(db, current_user, payload)

    if supabase_enabled():
        try:
            sync_profile(updated)
        except SupabaseSyncError as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return updated


@router.post("/me/sync")
def sync_me(current_user=Depends(get_current_user)):
    try:
        return sync_profile(current_user)
    except SupabaseSyncError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
