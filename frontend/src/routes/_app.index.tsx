import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";



import {
  PacketsAPI,
  AnomaliesAPI,
  AnalyticsAPI,
  type Packet,
  type Anomaly,
  type AnalyticsData,
} from "@/lib/api";

import { TrafficOverview } from "@/components/TrafficOverview";
import { NetworkOverview } from "@/components/NetworkOverview";
import { TrafficChart } from "@/components/TrafficChart";
import { TrafficSummary } from "@/components/TrafficSummary";
import { RecentPacketsTable } from "@/components/RecentPacketsTable";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      {
        title: "Dashboard — SentinelOps",
      },
      {
        name: "description",
        content: "Real-time network security operations dashboard.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {

    setLoading(true);
    setError(null);

    try {

      console.log("========== DASHBOARD ==========");

      console.log("Loading packets...");
      const packetData = await PacketsAPI.list();
      console.log("Packets Loaded:", packetData.length);

      console.log(packetData);

      console.log("Loading anomalies...");
      const anomalyData = await AnomaliesAPI.list();
      console.log("Anomalies Loaded:", anomalyData.length);

      console.log(anomalyData);

      console.log("Loading analytics...");
      const analyticsData = await AnalyticsAPI.get();

      console.log("Analytics Loaded");
      console.log(analyticsData);

      setPackets(
        Array.isArray(packetData)
          ? packetData
          : []
      );

      setAnomalies(
        Array.isArray(anomalyData)
          ? anomalyData
          : []
      );

      setAnalytics(analyticsData);

      setUpdated(new Date());

      console.log("Dashboard Updated Successfully");

    } catch (e: any) {

      console.error("=================================");
      console.error("Dashboard Error");
      console.error(e);

      if (e.response) {

        console.error("Status:", e.response.status);
        console.error("Response:", e.response.data);

      }

      setError(
        e?.message ?? "Failed to load dashboard"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    load();

    const timer = setInterval(load, 1000);

    return () => clearInterval(timer);

  }, []);

  return (
    <main className="page">

     

      <div className="page__header">

        <div>

          <h1 className="page__title">
            Security Operations
          </h1>

          <div className="page__subtitle">

            AI-powered Network Intrusion Detection Platform ·{" "}

            {updated
              ? `updated ${updated.toLocaleTimeString()}`
              : "loading..."}

          </div>

        </div>

        <button
          className="btn"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={13} /> Refresh
        </button>

      </div>

      {error && (

        <div
          className="alert alert--high"
          style={{ marginBottom: 12 }}
        >

          <div className="alert__type">
            Backend unreachable
          </div>

          <div
            className="muted"
            style={{ fontSize: 12 }}
          >
            {error}
          </div>

        </div>

      )}

      <div className="grid grid--dashboard">

        <TrafficOverview
          packets={packets}
        />

        <NetworkOverview
          packets={packets}
          lastUpdated={updated}
        />

        <TrafficSummary
          packets={packets}
        />

      </div>

      <div style={{ height: 12 }} />

      <div className="grid grid--row">

        <TrafficChart
          anomalies={anomalies}
        />

        <RecentPacketsTable
          packets={packets}
        />

      </div>

    </main>
  );
}