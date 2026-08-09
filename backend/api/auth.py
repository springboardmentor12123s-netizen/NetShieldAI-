from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from database.users import users

auth = Blueprint("auth", __name__)

@auth.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username", "").strip()
    password = data.get("password", "")
    role = data.get("role", "")

    # Validate empty fields
    if not username or not password or not role:
        return jsonify({
            "success": False,
            "message": "All fields are required."
        }), 400

    # Find user
    for user in users:

        if user["username"] == username:

            # Check password
            if not check_password_hash(user["password"], password):

                return jsonify({
                    "success": False,
                    "message": "Incorrect password."
                }), 401

            # Check role
            if user["role"] != role:

                return jsonify({
                    "success": False,
                    "message": "Selected role does not match your account."
                }), 401

            # Login Success
            return jsonify({

                "success": True,
                "id": user["id"],
                "name": user["name"],
                "username": user["username"],
                "role": user["role"]

            }), 200

    # Username not found
    return jsonify({

        "success": False,
        "message": "User not found."

    }), 404