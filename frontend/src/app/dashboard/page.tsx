"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartData
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { Activity, ShieldAlert, Zap, Server } from "lucide-react";
import AppShell from "../../components/AppShell";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const [role, setRole] = useState<string | null>("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [status, setStatus] = useState("Connecting to NetShield Core...");
  const [rawData, setRawData] = useState(null);
  
  // Dynamic State for our Data
  const [metrics, setMetrics] = useState({
    totalPackets: 0,
    anomalies: 0,
    intrusions: 0,
    systemLoad: "24%", // Keeping static for now unless your API sends server stats
  });

const [lineChartData, setLineChartData] = useState<ChartData<"line">>({
  labels: [],
  datasets: []
});

const [doughnutData, setDoughnutData] = useState<ChartData<"doughnut">>({
  labels: ["DDoS", "Port Scan", "Brute Force", "Normal"],
  datasets: [{ data: [0, 0, 0, 0], backgroundColor: [], borderWidth: 0 }]
});

  useEffect(() => {
    // --- 1. THE GATEKEEPER ---
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    // If either is missing, kick them to your existing login page
    if (!token || !role) {
      router.push("/login");
      return; 
    }
    
    // If they made it this far, they are authenticated!
    setIsAuthorized(true);
    // 1. Auth Check
    const storedRole = localStorage.getItem("userRole");
    if (!storedRole) {
      router.push("/login");
      return;
    } 
    setRole(storedRole);
    
    // 2. Fetch Live Data
    const fetchTrafficData = async () => {
      try {
        // 1. Grab the token that was saved when the user logged in
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");

        // 2. Attach the token to the fetch request
        const response = await fetch(`${API_URL}/api/traffic-stats?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        
        const result = await response.json();
        const data = result.data; // The 500 rows we ingested

        // --- DATA PROCESSING LOGIC ---
        // Example: Count total packets (length of array)
        const total = data.length;
        
        // Example: Count anomalies (assuming you have a 'Label' or 'Is_Anomaly' column)
        const anomalousPackets = data.filter((packet: any) => {
          const threatLabel = packet.Label || packet.label || packet['Attack Type'] || packet.Class;
          
          // If we found the label, make sure it is NOT a normal packet
          return threatLabel && 
                 threatLabel.toString().toUpperCase() !== 'BENIGN' && 
                 threatLabel.toString().toUpperCase() !== 'NORMAL' && 
                 threatLabel !== 0;
        }).length;
        
        setMetrics({
          totalPackets: total,
          anomalies: anomalousPackets,
          intrusions: Math.floor(anomalousPackets * 0.15), // Placeholder logic for active threats
          systemLoad: "28%"
        });

        // Update Line Chart (Placeholder time mapping for demonstration)
        setLineChartData({
          labels: ["Batch 1", "Batch 2", "Batch 3", "Batch 4", "Batch 5"],
          datasets: [
            {
              label: "Network Traffic (Packets)",
              data: [100, 250, total, 150, 90], // Replace with real time-series aggregation
              borderColor: "rgb(59, 130, 246)", 
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              tension: 0.4,
            },
            {
              label: "Anomalous Traffic",
              data: [5, 12, anomalousPackets, 8, 2], // Replace with real time-series aggregation
              borderColor: "rgb(239, 68, 68)",
              backgroundColor: "rgba(239, 68, 68, 0.5)",
              tension: 0.4,
            }
          ]
        });

        // Update Doughnut Chart based on attack types in your dataset
        setDoughnutData({
          labels: ["Anomaly", "Normal"],
          datasets: [
            {
              data: [anomalousPackets, total - anomalousPackets],
              backgroundColor: [
                "rgba(239, 68, 68, 0.8)", // Red (Anomaly)
                "rgba(34, 197, 94, 0.8)",  // Green (Normal)
              ],
              borderWidth: 0,
            },
          ],
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching live data:", error);
        setIsLoading(false);
      }
    };

    fetchTrafficData();
    // 2. THE HEARTBEAT: Set up a timer to fetch new data every 3 seconds!
    const intervalId = setInterval(fetchTrafficData, 3000);

    // 3. Clean up the timer if the user logs out or leaves the page
    return () => clearInterval(intervalId);
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-blue-500 font-bold text-xl animate-pulse">
        Verifying NetShield Credentials...
      </div>
    );
  }
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-blue-500 font-bold text-xl animate-pulse">Initializing NetShield Core...</div>;
  }

  return (
    <AppShell
      role={role}
      title="Traffic Analytics Dashboard"
      activePath="/dashboard"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
          
          {/* Key Performance Indicators (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Packets Scanned</p>
                <h3 className="text-3xl font-bold text-white">{metrics.totalPackets}</h3>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg text-blue-500">
                <Activity size={24} />
              </div>
            </div>
            
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Anomalies Detected</p>
                <h3 className="text-3xl font-bold text-red-400">{metrics.anomalies}</h3>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
                <ShieldAlert size={24} />
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Intrusions</p>
                <h3 className="text-3xl font-bold text-orange-400">{metrics.intrusions}</h3>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg text-orange-500">
                <Zap size={24} />
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">System Load</p>
                <h3 className="text-3xl font-bold text-green-400">{metrics.systemLoad}</h3>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                <Server size={24} />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Line Chart */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-200 mb-4">Live Network Traffic</h3>
              <div className="h-72 w-full">
                {lineChartData.datasets.length > 0 && (
                  <Line 
                    data={lineChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top', labels: { color: '#9CA3AF' } }
                      },
                      scales: {
                        y: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } },
                        x: { grid: { color: '#374151' }, ticks: { color: '#9CA3AF' } }
                      }
                    }} 
                  />
                )}
              </div>
            </div>

            {/* Doughnut Chart */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-sm">
              <h3 className="text-lg font-medium text-gray-200 mb-4">Threat Classification</h3>
              <div className="h-64 w-full flex justify-center pb-4">
                {doughnutData.datasets.length > 0 && (
                  <Doughnut 
                    data={doughnutData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { color: '#9CA3AF', padding: 20 } }
                      },
                      cutout: '70%'
                    }} 
                  />
                )}
              </div>
            </div>
          </div>

        </div>
    </AppShell>
  );
}