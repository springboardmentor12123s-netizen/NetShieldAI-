import { useEffect, useState } from 'react'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Activity, Database, AlertTriangle, Server } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, r] = await Promise.all([api.get('/traffic/stats'), api.get('/traffic?limit=10')])
        setStats(s.data); setRecent(r.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const chartData = stats?.labels?.map(i => ({ name: i.label || 'Unknown', count: i.count })) || []
  const anomalyCount = stats?.labels?.filter(l => l.label !== 'BENIGN').reduce((a, b) => a + b.count, 0) || 0
  const totalCount = stats?.labels?.reduce((a, b) => a + b.count, 0) || 0

  if (loading) return <div className="p-6">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Database className="w-5 h-5 text-blue-600" />} title="Total Records" value={totalCount.toLocaleString()} />
        <StatCard icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} title="Anomalies" value={anomalyCount.toLocaleString()} />
        <StatCard icon={<Activity className="w-5 h-5 text-emerald-600" />} title="Classes" value={stats?.labels?.length || 0} />
        <StatCard icon={<Server className="w-5 h-5 text-purple-600" />} title="Monitors" value="2" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Traffic Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Recent Traffic</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr><th className="px-4 py-3">Timestamp</th><th className="px-4 py-3">Source IP</th><th className="px-4 py-3">Destination IP</th><th className="px-4 py-3">Label</th><th className="px-4 py-3">Dataset</th></tr>
            </thead>
            <tbody>
              {recent.map(row => (
                <tr key={row.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3">{new Date(row.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{row.source_ip}</td>
                  <td className="px-4 py-3">{row.destination_ip}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.label === 'BENIGN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.label}</span>
                  </td>
                  <td className="px-4 py-3">{row.dataset_source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
      <div><p className="text-sm text-slate-500">{title}</p><p className="text-xl font-bold text-slate-800">{value}</p></div>
    </div>
  )
}
