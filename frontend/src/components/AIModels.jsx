import { useState } from 'react'
import api from '../services/api'
import { BrainCircuit, ShieldAlert, Play, Activity } from 'lucide-react'

export default function AIModels() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAction = async (endpoint, actionName) => {
    setLoading(true)
    setMessage(`Starting ${actionName}...`)
    try {
      const res = await api.post(endpoint)
      let msg = `Success: ${res.data.message}`
      if (res.data.etc_seconds) {
        msg += ` (ETC: ~${res.data.etc_seconds} seconds)`
      }
      setMessage(msg)
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-800">AI Models Management</h2>
      <p className="text-slate-600">Train anomaly detection and threat classification models, and run batch predictions.</p>

      {message && (
        <div className="p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModelCard 
          icon={<Activity className="w-8 h-8 text-emerald-600" />}
          title="Anomaly Detection Model"
          description="Unsupervised learning model (Isolation Forest) to detect unusual network traffic patterns."
          onAction={() => handleAction('/ml/train/anomaly', 'Anomaly Model Training')}
          actionText="Train Anomaly Model"
          disabled={loading}
        />
        <ModelCard 
          icon={<ShieldAlert className="w-8 h-8 text-red-600" />}
          title="Threat Classification Model"
          description="Supervised model (XGBoost) to classify known attack signatures and categorize threats."
          onAction={() => handleAction('/ml/train/threat', 'Threat Model Training')}
          actionText="Train Threat Model"
          disabled={loading}
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-600"/> Batch Prediction Engine</h3>
          <p className="text-sm text-slate-500 mt-1">Run trained AI models on recent unscored network traffic to calculate risk scores.</p>
        </div>
        <button 
          onClick={() => handleAction('/ml/predict', 'Batch Prediction')}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-50"
        >
          <Play className="w-4 h-4" /> Run Predictions
        </button>
      </div>
    </div>
  )
}

function ModelCard({ icon, title, description, onAction, actionText, disabled }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 flex-1 mb-6">{description}</p>
      <button 
        onClick={onAction}
        disabled={disabled}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
      >
        {actionText}
      </button>
    </div>
  )
}
