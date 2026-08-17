import React, { useEffect, useState } from "react";
import axios from "axios";

import {
  FaHeartbeat,
  FaBullseye,
  FaChartLine,
  FaSyncAlt,
  FaNetworkWired,
  FaClock,
  FaRobot,
  FaMicrochip,
  FaMemory,
  FaShieldAlt,
  FaServer,
  FaArrowRight
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import "./HealthValidation.css";

function HealthValidation() {

  const [livePerformance, setLivePerformance] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");

  // =========================================================
  // FETCH LIVE DATA
  // =========================================================

  useEffect(() => {

    const fetchLiveData = async () => {

      try {

        const performanceResponse = await axios.get(
          "http://127.0.0.1:8000/traffic/live/performance"
        );

        setLivePerformance(
          performanceResponse.data
        );


        try {

          const predictionResponse = await axios.get(
            "http://127.0.0.1:8000/traffic/live"
          );

          setLatestPrediction(
            predictionResponse.data
          );

        } catch (predictionError) {

          console.log(
            "Latest prediction unavailable:",
            predictionError
          );

        }


        setLastUpdated(
          new Date().toLocaleTimeString()
        );

        setError("");

      } catch (err) {

        console.error(
          "Live validation error:",
          err
        );

        setError(
          "Unable to load live validation data."
        );

      }

    };


    fetchLiveData();

    const interval = setInterval(
      fetchLiveData,
      5000
    );

    return () => clearInterval(interval);

  }, []);


  // =========================================================
  // LOADING
  // =========================================================

  if (!livePerformance) {

    return (

      <div className="health-layout">

        <Sidebar />

        <main className="health-content">

          <div className="loading-card">

            <FaSyncAlt className="loading-icon" />

            <h2>
              Loading Live Health Validation...
            </h2>

            <p>
              Waiting for live traffic data.
            </p>

          </div>

        </main>

      </div>

    );

  }


  // =========================================================
  // LIVE PERFORMANCE VALUES
  // =========================================================

  const liveAccuracy =
    livePerformance.live_accuracy ?? 0;

  const livePrecision =
    livePerformance.live_precision_macro ?? 0;

  const liveRecall =
    livePerformance.live_recall_macro ?? 0;

  const liveF1 =
    livePerformance.live_f1_macro ?? 0;

  const liveRocAuc =
    livePerformance.live_roc_auc;


  const liveSamples =
    livePerformance.live_samples ??
    livePerformance.total_test_flows ??
    0;

  const correctPredictions =
    livePerformance.correct_test_flows ?? 0;


  // =========================================================
  // LATEST PREDICTION
  // =========================================================

  const prediction =
    latestPrediction?.prediction ??
    "Waiting...";

  const confidence =
    latestPrediction?.confidence ?? 0;

  const risk =
    latestPrediction?.risk ??
    "Unknown";

  const threatType =
    latestPrediction?.threat_type ??
    "Waiting for live traffic";

  const recommendation =
    latestPrediction?.recommendation ??
    "Waiting for live traffic analysis.";

  const source =
    latestPrediction?.source ??
    "N/A";

  const destination =
    latestPrediction?.destination ??
    "N/A";

  const protocol =
    latestPrediction?.protocol ??
    "N/A";


  // =========================================================
  // RISK CLASS
  // =========================================================

  const getRiskClass = () => {

    if (risk === "Critical") {
      return "risk-critical";
    }

    if (risk === "High") {
      return "risk-high";
    }

    if (risk === "Medium") {
      return "risk-medium";
    }

    if (risk === "Low") {
      return "risk-low";
    }

    return "risk-unknown";

  };


  // =========================================================
  // PAGE
  // =========================================================

  return (

    <div className="health-layout">

      <Sidebar />

      <main className="health-content">


        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="health-header">

          <div className="title-section">

            <div className="health-icon">
              <FaHeartbeat />
            </div>

            <div>

              <h1>
                Health Validation
              </h1>

              <p>
                Real-time model and system validation
              </p>

            </div>

          </div>


          <div className="header-right">

            <div className="updated">

              <FaSyncAlt />

              Last updated: {lastUpdated}

            </div>


            <div className="header-live">

              <span></span>

              LIVE

            </div>

          </div>

        </div>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (

          <div className="error-box">

            {error}

          </div>

        )}


        {/* =====================================================
            LIVE TRAFFIC TESTING
        ===================================================== */}

        <section className="live-traffic-card">


          <div className="live-traffic-header">

            <div className="live-title">

              <div className="live-title-icon">

                <FaNetworkWired />

              </div>


              <div>

                <h2>
                  Live Traffic Testing
                </h2>

                <p>
                  Real network traffic is being captured,
                  converted into flow features, and analyzed
                  by the AI model in real time.
                </p>

              </div>

            </div>


            <div className="live-badge">

              <span className="live-dot"></span>

              LIVE

            </div>

          </div>


          <div className="live-prediction-content">


            {/* CURRENT PREDICTION */}

            <div className="prediction-main">

              <span className="prediction-label">
                CURRENT LIVE PREDICTION
              </span>


              <div className="prediction-name">

                <div className="prediction-shield">

                  <FaShieldAlt />

                </div>


                <div>

                  <h1>
                    {prediction}
                  </h1>

                  <p>
                    {threatType}
                  </p>

                  <span
                    className={`risk-badge ${getRiskClass()}`}
                  >
                    {risk} Risk
                  </span>

                </div>

              </div>

            </div>


            {/* CONFIDENCE */}

            <div className="confidence-section">

              <div
                className="confidence-circle"
                style={{
                  "--confidence": confidence
                }}
              >

                <div>

                  <span>
                    Confidence
                  </span>

                  <strong>
                    {confidence}%
                  </strong>

                </div>

              </div>

            </div>


            {/* NETWORK */}

            <div className="network-details">


              <div className="network-item">

                <div className="network-icon blue">
                  <FaNetworkWired />
                </div>

                <div>

                  <span>
                    Protocol
                  </span>

                  <strong>
                    {protocol}
                  </strong>

                </div>

              </div>


              <div className="network-item">

                <div className="network-icon blue">
                  <FaServer />
                </div>

                <div>

                  <span>
                    Source
                  </span>

                  <strong>
                    {source}
                  </strong>

                </div>

              </div>


              <div className="network-arrow">
                <FaArrowRight />
              </div>


              <div className="network-item">

                <div className="network-icon blue">
                  <FaShieldAlt />
                </div>

                <div>

                  <span>
                    Destination
                  </span>

                  <strong>
                    {destination}
                  </strong>

                </div>

              </div>

            </div>


            {/* THREAT */}

            <div className="threat-details">


              <div className="threat-item">

                <div className="threat-icon">
                  <FaShieldAlt />
                </div>

                <div>

                  <span>
                    Threat Type
                  </span>

                  <strong>
                    {threatType}
                  </strong>

                </div>

              </div>


              <div className="threat-item">

                <div className="threat-icon">
                  <FaRobot />
                </div>

                <div>

                  <span>
                    Recommendation
                  </span>

                  <strong>
                    {recommendation}
                  </strong>

                </div>

              </div>

            </div>


            {/* VISUAL */}

            <div className="live-illustration">

              <div className="illustration-circle">

                <FaHeartbeat />

              </div>


              <div className="illustration-shield">

                <FaShieldAlt />

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            LIVE MODEL PERFORMANCE
        ===================================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <FaChartLine />

            <h2>
              Live Model Performance
            </h2>

          </div>


          <div className="metric-grid">


            {/* ACCURACY */}

            <div className="metric-card accuracy">

              <div className="metric-icon">

                <FaBullseye />

              </div>

              <div className="metric-info">

                <p>
                  Accuracy
                </p>

                <h2>
                  {liveSamples > 0
                    ? `${liveAccuracy}%`
                    : "N/A"}
                </h2>

              </div>

            </div>


            {/* PRECISION */}

            <div className="metric-card precision">

              <div className="metric-icon">

                <FaBullseye />

              </div>

              <div className="metric-info">

                <p>
                  Precision
                </p>

                <h2>
                  {liveSamples > 0
                    ? `${livePrecision}%`
                    : "N/A"}
                </h2>

              </div>

            </div>


            {/* RECALL */}

            <div className="metric-card recall">

              <div className="metric-icon">

                <FaChartLine />

              </div>

              <div className="metric-info">

                <p>
                  Recall
                </p>

                <h2>
                  {liveSamples > 0
                    ? `${liveRecall}%`
                    : "N/A"}
                </h2>

              </div>

            </div>


            {/* F1 */}

            <div className="metric-card f1">

              <div className="metric-icon">

                <FaRobot />

              </div>

              <div className="metric-info">

                <p>
                  F1 Score
                </p>

                <h2>
                  {liveSamples > 0
                    ? `${liveF1}%`
                    : "N/A"}
                </h2>

              </div>

            </div>


            {/* ROC-AUC */}

            <div className="metric-card roc">

              <div className="metric-icon">

                <FaChartLine />

              </div>

              <div className="metric-info">

                <p>
                  ROC-AUC
                </p>

                <h2>

                  {liveRocAuc !== null &&
                   liveRocAuc !== undefined

                    ? `${liveRocAuc}%`

                    : "N/A"}

                </h2>

              </div>

            </div>

          </div>


          {/* LIVE TEST INFO */}

          <div className="performance-info">

            <div>

              <span>
                Live Samples
              </span>

              <strong>
                {liveSamples}
              </strong>

            </div>


            <div>

              <span>
                Correct Predictions
              </span>

              <strong>
                {correctPredictions}
              </strong>

            </div>


            <div>

              <span>
                Validation
              </span>

              <strong>
                Live
              </strong>

            </div>

          </div>

        </section>


        {/* =====================================================
            LIVE SYSTEM VALIDATION
        ===================================================== */}

        <section className="dashboard-section">

          <div className="section-title">

            <FaServer />

            <h2>
              Live System Validation
            </h2>

          </div>


          <div className="live-metric-grid">


            <div className="live-metric-card cyan">

              <div className="live-metric-icon">
                <FaNetworkWired />
              </div>

              <div className="live-metric-info">

                <p>
                  Packets Processed
                </p>

                <h2>
                  {livePerformance.packets_processed ?? 0}
                </h2>

              </div>

            </div>


            <div className="live-metric-card blue">

              <div className="live-metric-icon">
                <FaChartLine />
              </div>

              <div className="live-metric-info">

                <p>
                  Flows Processed
                </p>

                <h2>
                  {livePerformance.flows_processed ?? 0}
                </h2>

              </div>

            </div>


            <div className="live-metric-card purple">

              <div className="live-metric-icon">
                <FaClock />
              </div>

              <div className="live-metric-info">

                <p>
                  Feature Extraction
                </p>

                <h2>
                  {livePerformance.feature_extraction_latency_ms ?? 0} ms
                </h2>

              </div>

            </div>


            <div className="live-metric-card orange">

              <div className="live-metric-icon">
                <FaRobot />
              </div>

              <div className="live-metric-info">

                <p>
                  AI Inference
                </p>

                <h2>
                  {livePerformance.ai_inference_latency_ms ?? 0} ms
                </h2>

              </div>

            </div>


            <div className="live-metric-card pink">

              <div className="live-metric-icon">
                <FaServer />
              </div>

              <div className="live-metric-info">

                <p>
                  API Response
                </p>

                <h2>
                  {livePerformance.api_response_time_ms ?? 0} ms
                </h2>

              </div>

            </div>


            <div className="live-metric-card green">

              <div className="live-metric-icon">
                <FaMicrochip />
              </div>

              <div className="live-metric-info">

                <p>
                  CPU Usage
                </p>

                <h2>
                  {livePerformance.cpu_usage_percent ?? 0}%
                </h2>

              </div>

            </div>


            <div className="live-metric-card indigo">

              <div className="live-metric-icon">
                <FaMemory />
              </div>

              <div className="live-metric-info">

                <p>
                  RAM Usage
                </p>

                <h2>
                  {livePerformance.ram_usage_mb ?? 0} MB
                </h2>

              </div>

            </div>


            <div className="live-metric-card cyan">

              <div className="live-metric-icon">
                <FaNetworkWired />
              </div>

              <div className="live-metric-info">

                <p>
                  Live Samples
                </p>

                <h2>
                  {liveSamples}
                </h2>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            LIVE TESTING STATUS
        ===================================================== */}

        <section className="status-panel">

          <div className="section-title">

            <FaShieldAlt />

            <h2>
              Live Testing Status
            </h2>

          </div>


          <div className="status-grid">


            <div className="status-item">

              <div className="status-icon green-icon">
                <FaNetworkWired />
              </div>

              <div>

                <span>
                  Traffic Capture
                </span>

                <strong>
                  Active
                </strong>

              </div>

            </div>


            <div className="status-item">

              <div className="status-icon blue-icon">
                <FaChartLine />
              </div>

              <div>

                <span>
                  Flows Analyzed
                </span>

                <strong>
                  {livePerformance.flows_processed ?? 0}
                </strong>

              </div>

            </div>


            <div className="status-item">

              <div className="status-icon cyan-icon">
                <FaNetworkWired />
              </div>

              <div>

                <span>
                  Packets Analyzed
                </span>

                <strong>
                  {livePerformance.packets_processed ?? 0}
                </strong>

              </div>

            </div>


            <div className="status-item">

              <div className="status-icon green-icon">
                <FaBullseye />
              </div>

              <div>

                <span>
                  Current Accuracy
                </span>

                <strong>
                  {liveSamples > 0
                    ? `${liveAccuracy}%`
                    : "N/A"}
                </strong>

              </div>

            </div>


            <div className="status-item">

              <div className="status-icon purple-icon">
                <FaRobot />
              </div>

              <div>

                <span>
                  AI Model
                </span>

                <strong>
                  Random Forest
                </strong>

              </div>

            </div>


            <div className="status-item">

              <div className="status-icon pink-icon">
                <FaSyncAlt />
              </div>

              <div>

                <span>
                  Validation Status
                </span>

                <strong>
                  Live
                </strong>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>

  );

}

export default HealthValidation;