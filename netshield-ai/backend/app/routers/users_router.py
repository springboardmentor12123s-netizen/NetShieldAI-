from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user, hash_password, require_role, verify_password
from app.database import users_collection
from app.models import ChangePasswordRequest, UserAdminOut, UserOut, UserUpdateActive, UserUpdateProfile, UserUpdateRole

router = APIRouter(prefix="/api/users", tags=["users"])


def _serialize(doc) -> dict:
    return {
        "id": str(doc["_id"]),
        "username": doc["username"],
        "email": doc.get("email"),
        "full_name": doc.get("full_name"),
        "role": doc.get("role", "security_analyst"),
        "is_active": doc.get("is_active", True),
        "created_at": doc.get("created_at"),
    }


@router.get("/me", response_model=UserOut)
async def me(current_user=Depends(get_current_user)):
    return UserOut(
        username=current_user["username"],
        email=current_user.get("email"),
        full_name=current_user.get("full_name"),
        role=current_user.get("role", "security_analyst"),
        is_active=current_user.get("is_active", True),
    )


@router.put("/me", response_model=UserOut)
async def update_me(payload: UserUpdateProfile, current_user=Depends(get_current_user)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        if "email" in updates:
            clash = await users_collection.find_one(
                {"email": updates["email"], "_id": {"$ne": current_user["_id"]}}
            )
            if clash:
                raise HTTPException(status_code=400, detail="Another account already uses this email")
        await users_collection.update_one({"_id": current_user["_id"]}, {"$set": updates})
    fresh = await users_collection.find_one({"_id": current_user["_id"]})
    return UserOut(
        username=fresh["username"], email=fresh.get("email"), full_name=fresh.get("full_name"),
        role=fresh.get("role", "security_analyst"), is_active=fresh.get("is_active", True),
    )


@router.post("/me/change-password")
async def change_password(payload: ChangePasswordRequest, current_user=Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await users_collection.update_one(
        {"_id": current_user["_id"]}, {"$set": {"hashed_password": hash_password(payload.new_password)}}
    )
    return {"message": "Password updated successfully"}


# ---- Admin-only user management ----

@router.get("", response_model=list[UserAdminOut])
async def list_users(current_user=Depends(require_role("admin"))):
    cursor = users_collection.find().sort("created_at", -1)
    return [_serialize(doc) async for doc in cursor]


@router.put("/{user_id}/role")
async def update_role(user_id: str, payload: UserUpdateRole, current_user=Depends(require_role("admin"))):
    result = await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": payload.role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Role updated"}


@router.put("/{user_id}/active")
async def set_active(user_id: str, payload: UserUpdateActive, current_user=Depends(require_role("admin"))):
    if str(current_user["_id"]) == user_id and not payload.is_active:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"is_active": payload.is_active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User active status updated"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user=Depends(require_role("admin"))):
    if str(current_user["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
