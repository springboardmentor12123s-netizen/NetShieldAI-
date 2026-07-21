import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import "../styles/Dashboard.css";

function Users() {

    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {

        const token = localStorage.getItem("token");

        axios.get("http://127.0.0.1:8000/users", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            setUsers(res.data.users);
        })
        .catch((err) => {
            console.log(err);
        });

        axios.get("http://127.0.0.1:8000/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then((res) => {
            setCurrentUser(res.data.user);
        });

    }, []);

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="content">

                <Navbar user={currentUser} />

                <h2>Registered Users</h2>

                <table
    style={{
        width: "100%",
        background: "#fff",
        borderCollapse: "collapse",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}
>

    <thead>

        <tr
            style={{
                background: "#4F46E5",
                color: "white"
            }}
        >

            <th style={{ padding: "15px", textAlign: "left" }}>Full Name</th>

            <th style={{ padding: "15px", textAlign: "left" }}>Email</th>

            <th style={{ padding: "15px", textAlign: "center" }}>Role</th>

            <th style={{ padding: "15px", textAlign: "center" }}>Team</th>

        </tr>

    </thead>

    <tbody>

        {users.map((user) => (

            <tr
                key={user.id}
                style={{
                    borderBottom: "1px solid #ddd"
                }}
            >

                <td style={{ padding: "15px" }}>
                    {user.full_name}
                </td>

                <td style={{ padding: "15px" }}>
                    {user.email}
                </td>

                <td
                    style={{
                        padding: "15px",
                        textAlign: "center"
                    }}
                >
                    {user.role}
                </td>

                <td
                    style={{
                        padding: "15px",
                        textAlign: "center"
                    }}
                >
                    {user.team_id}
                </td>

            </tr>

        ))}

    </tbody>

</table>
            </div>

        </div>

    );

}

export default Users;