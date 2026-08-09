from werkzeug.security import generate_password_hash

users = [

    {
        "id": 1,
        "username": "admin",
        "password": generate_password_hash("admin123"),
        "role": "Admin",
        "name": "System Administrator"
    },

    {
        "id": 2,
        "username": "analyst",
        "password": generate_password_hash("analyst123"),
        "role": "Analyst",
        "name": "Security Analyst"
    },

    {
        "id": 3,
        "username": "viewer",
        "password": generate_password_hash("viewer123"),
        "role": "Viewer",
        "name": "Read Only User"
    }

]