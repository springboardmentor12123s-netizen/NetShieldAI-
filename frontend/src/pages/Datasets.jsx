import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import DatasetTable from "../components/DatasetTable";
import "../styles/dashboard.css";

function Datasets() {

    return (

        <div className="dashboard">

            <Sidebar />

            <div className="main">

                <Navbar />

                <DatasetTable />

            </div>

        </div>

    );

}

export default Datasets;