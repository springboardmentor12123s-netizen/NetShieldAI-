import "../styles/navbar.css";

function Navbar() {

    const user = JSON.parse(localStorage.getItem("user"));

    return (

        <div className="navbar">

            <div className="nav-left">


                <div>

                    <h2>🛡 NetShield AI Dashboard</h2>

                    <p className="subtitle">

                        AI Powered Cyber Security Monitoring System

                    </p>

                </div>

            </div>

            <div className="nav-right">

                <span className="status">

                    🟢 System Online

                </span>

                <span className="user">

                    👤 {user?.username || "Admin"}

                </span>

            </div>

        </div>

    );

}

export default Navbar;