import { useEffect, useState } from 'react'
import api from '../services/api'
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react'

export default function Threats() {
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/ml/reports')
        setReports(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) return <div className="p-6">Loading threat intelligence...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-red-600" />
        <h2 className="text-2xl font-bold text-slate-800">Threat Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Traffic Scored" value={reports?.total_scored?.toLocaleString() || 0} />
        <StatCard title="Threats Detected" value={reports?.threat_count?.toLocaleString() || 0} highlight="text-red-600" />
        <StatCard title="High Risk Incidents" value={reports?.high_risk_incidents?.length || 0} highlight="text-amber-600" />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Identified Threat Types</h3>
        <div className="flex flex-wrap gap-3">
          {reports?.threat_types?.length > 0 ? (
            reports.threat_types.map(t => (
              <div key={t.label} className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex items-center justify-between min-w-[200px]">
                <span className="font-semibold">{t.label}</span>
                <span className="bg-red-200 text-red-800 px-2 py-0.5 rounded-full text-xs font-bold">{t.count}</span>
              </div>
            ))
          ) : (
             <div className="text-slate-500 flex items-center gap-2"><Info className="w-4 h-4"/> No threats classified yet.</div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" /> High Risk Traffic Log
        </h3>
        {reports?.high_risk_incidents?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Source IP</th>
                  <th className="px-4 py-3">Target IP</th>
                  <th className="px-4 py-3">Prediction</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {reports.high_risk_incidents.map(inc => (
                  <tr key={inc.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{new Date(inc.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-xs">{inc.source_ip}</td>
                    <td className="px-4 py-3 font-mono text-xs">{inc.destination_ip}</td>
                    <td className="px-4 py-3">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">
                        {inc.predicted_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-200 rounded-full h-2 max-w-[60px]">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: `${inc.risk_score}%`}}></div>
                        </div>
                        <span className="text-xs font-bold text-red-600">{inc.risk_score}/100</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {(inc.prediction_confidence * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-slate-500 p-4 text-center bg-slate-50 rounded-lg">No high risk incidents found in recent traffic.</div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, highlight }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
      <p className="text-sm text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      <p className={`text-4xl font-black ${highlight || 'text-slate-800'}`}>{value}</p>
    </div>
  )
}
