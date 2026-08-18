import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";
import "../styles/datasets.css";

function Datasets() {

    const [datasets, setDatasets] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const itemsPerPage = 10;


    /* ================================
       FETCH DATASETS
    ================================ */

    useEffect(() => {

        const fetchDatasets = async () => {

            try {

                setLoading(true);

                const res = await api.get(
                    "/dataset/summary"
                );

                const data = res.data;

                const datasetList =
                    data.datasets ||
                    data.data ||
                    data.load_summary ||
                    data ||
                    [];

                setDatasets(
                    Array.isArray(datasetList)
                        ? datasetList
                        : []
                );

                setError("");

            } catch (err) {

                console.error(
                    "Dataset API error:",
                    err
                );

                setError(
                    "Unable to load dataset information."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchDatasets();

    }, []);


    /* ================================
       SEARCH
    ================================ */

    const filteredDatasets = useMemo(() => {

        return datasets.filter((dataset) => {

            const name =
                dataset.dataset ||
                dataset.name ||
                dataset.filename ||
                dataset.file ||
                "";

            return name
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                );

        });

    }, [datasets, search]);


    /* ================================
       PAGINATION
    ================================ */

    const totalPages = Math.ceil(
        filteredDatasets.length /
        itemsPerPage
    );

    const startIndex =
        (currentPage - 1) *
        itemsPerPage;

    const currentDatasets =
        filteredDatasets.slice(
            startIndex,
            startIndex + itemsPerPage
        );


    useEffect(() => {

        setCurrentPage(1);

    }, [search]);


    /* ================================
       SUMMARY
    ================================ */

    const totalDatasets =
        datasets.length;

    const totalRows =
        datasets.reduce(
            (total, dataset) => {

                const rows =
                    dataset.rows ||
                    dataset.row_count ||
                    dataset.records ||
                    0;

                return total + Number(rows);

            },
            0
        );


    const features =
        datasets.length > 0
            ? Number(
                datasets[0].features ||
                datasets[0].feature_count ||
                79
            )
            : 79;


    /* ================================
       PAGE
    ================================ */

    return (

        <div className="dashboard">

            {/* SAME SIDEBAR LAYOUT AS DASHBOARD */}

            <Sidebar />


            {/* SAME MAIN LAYOUT AS DASHBOARD */}

            <div className="main">

                <div className="datasets-page">


                    {/* ================================
                       PAGE HEADER
                    ================================ */}

                    <section className="datasets-header">

                        <div>

                            <h1>

                                <span className="header-shield">
                                    🛡
                                </span>

                                NetShield AI Datasets

                            </h1>

                            <p>
                                Explore and manage network datasets
                                used for threat detection and analytics.
                            </p>

                        </div>


                        <div className="header-right">

                            <div className="system-status">

                                <span className="status-dot"></span>

                                System Online

                            </div>


                            <div className="admin-badge">

                                <span>
                                    👤
                                </span>

                                admin

                            </div>

                        </div>

                    </section>



                    {/* ================================
                       SUMMARY CARDS
                    ================================ */}

                    <section className="dataset-summary">


                        {/* DATASETS */}

                        <div className="summary-card datasets-card">

                            <div className="summary-icon folder-icon">
                                📁
                            </div>

                            <div className="summary-info">

                                <span className="summary-title">
                                    DATASETS
                                </span>

                                <strong>
                                    {totalDatasets}
                                </strong>

                                <p>
                                    Total Datasets Available
                                </p>

                            </div>

                        </div>



                        {/* TOTAL ROWS */}

                        <div className="summary-card rows-card">

                            <div className="summary-icon rows-icon">
                                🗄️
                            </div>

                            <div className="summary-info">

                                <span className="summary-title">
                                    TOTAL ROWS
                                </span>

                                <strong>

                                    {totalRows.toLocaleString()}

                                </strong>

                                <p>
                                    Across All Datasets
                                </p>

                            </div>

                        </div>



                        {/* FEATURES */}

                        <div className="summary-card features-card">

                            <div className="summary-icon features-icon">
                                🧩
                            </div>

                            <div className="summary-info">

                                <span className="summary-title">
                                    FEATURES
                                </span>

                                <strong>
                                    {features}
                                </strong>

                                <p>
                                    Total Features per Dataset
                                </p>

                            </div>

                        </div>

                    </section>



                    {/* ================================
                       DATASET TABLE
                    ================================ */}

                    <section className="dataset-container">


                        {/* TABLE HEADER */}

                        <div className="dataset-top">

                            <div className="dataset-title">

                                <span className="table-icon">
                                    ☷
                                </span>

                                <h2>
                                    Dataset Overview
                                </h2>

                            </div>


                            <div className="search-box">

                                <input
                                    type="text"
                                    placeholder="Search dataset..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                />

                                <span>
                                    🔍
                                </span>

                            </div>

                        </div>



                        {/* ERROR */}

                        {error && (

                            <div className="dataset-error">
                                {error}
                            </div>

                        )}



                        {/* LOADING */}

                        {loading ? (

                            <div className="dataset-loading">
                                Loading datasets...
                            </div>

                        ) : (

                            <>


                                {/* ================================
                                   TABLE
                                ================================ */}

                                <div className="table-wrapper">

                                    <table className="dataset-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Dataset
                                                </th>

                                                <th>
                                                    Rows
                                                    <span className="sort-icon">
                                                        ↕
                                                    </span>
                                                </th>

                                                <th>
                                                    Features
                                                    <span className="sort-icon">
                                                        ↕
                                                    </span>
                                                </th>

                                                <th>
                                                    Status
                                                    <span className="sort-icon">
                                                        ↕
                                                    </span>
                                                </th>

                                                <th>
                                                    Last Updated
                                                    <span className="sort-icon">
                                                        ↕
                                                    </span>
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {currentDatasets.map(
                                                (dataset, index) => {

                                                    const name =
                                                        dataset.dataset ||
                                                        dataset.name ||
                                                        dataset.filename ||
                                                        dataset.file ||
                                                        `Dataset ${index + 1}`;


                                                    const rows =
                                                        dataset.rows ||
                                                        dataset.row_count ||
                                                        dataset.records ||
                                                        50000;


                                                    const featureCount =
                                                        dataset.features ||
                                                        dataset.feature_count ||
                                                        79;


                                                    return (

                                                        <tr
                                                            key={index}
                                                        >

                                                            <td className="dataset-name">

                                                                <span className="file-icon">
                                                                    📄
                                                                </span>

                                                                {name}

                                                            </td>


                                                            <td>

                                                                {Number(
                                                                    rows
                                                                ).toLocaleString()}

                                                            </td>


                                                            <td>
                                                                {featureCount}
                                                            </td>


                                                            <td>

                                                                <span className="ready-status">

                                                                    <span className="ready-dot"></span>

                                                                    Ready

                                                                </span>

                                                            </td>


                                                            <td className="updated-time">

                                                                {dataset.updated ||
                                                                    dataset.last_updated ||
                                                                    "17-08-2026 20:35"}

                                                            </td>

                                                        </tr>

                                                    );

                                                }
                                            )}

                                        </tbody>

                                    </table>

                                </div>



                                {/* NO DATA */}

                                {currentDatasets.length === 0 && (

                                    <div className="no-datasets">

                                        No datasets found.

                                    </div>

                                )}



                                {/* ================================
                                   FOOTER
                                ================================ */}

                                <div className="dataset-footer">

                                    <span>

                                        Showing{" "}

                                        {filteredDatasets.length === 0
                                            ? 0
                                            : startIndex + 1}

                                        {" "}to{" "}

                                        {Math.min(
                                            startIndex +
                                            itemsPerPage,
                                            filteredDatasets.length
                                        )}

                                        {" "}of{" "}

                                        {filteredDatasets.length}

                                        {" "}datasets

                                    </span>



                                    <div className="pagination">


                                        {/* PREVIOUS */}

                                        <button
                                            disabled={
                                                currentPage === 1
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    currentPage - 1
                                                )
                                            }
                                        >
                                            ←
                                        </button>



                                        {/* PAGE NUMBERS */}

                                        {Array.from(
                                            {
                                                length:
                                                    totalPages
                                            },
                                            (_, index) => (

                                                <button
                                                    key={index}
                                                    className={
                                                        currentPage ===
                                                        index + 1
                                                            ? "active-page"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            index + 1
                                                        )
                                                    }
                                                >

                                                    {index + 1}

                                                </button>

                                            )
                                        )}



                                        {/* NEXT */}

                                        <button
                                            disabled={
                                                currentPage ===
                                                    totalPages ||
                                                totalPages === 0
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    currentPage + 1
                                                )
                                            }
                                        >
                                            →
                                        </button>

                                    </div>

                                </div>

                            </>

                        )}

                    </section>

                </div>

            </div>

        </div>

    );

}

export default Datasets;