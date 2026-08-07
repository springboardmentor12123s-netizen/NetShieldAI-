import { useEffect, useState, useCallback } from "react";
import { AlertCircle, AlertTriangle, Shield, CheckCircle, Info, Edit2, Check, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import api from "../services/api";

const statusColors = {
  Open: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Investigating: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const priorityColors = {
  Critical: "bg-rose-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-amber-400 text-slate-900",
  Low: "bg-emerald-500 text-white",
};

const severityColors = {
  Critical: "text-rose-400",
  High: "text-orange-400",
  Medium: "text-amber-400",
  Low: "text-emerald-400",
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy] = useState("timestamp");
  const [sortDesc] = useState(true);

  // Edit Modal State
  const [editingIncident, setEditingIncident] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAssignedTo, setEditAssignedTo] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_desc: sortDesc.toString(),
      });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (severityFilter) params.append("severity", severityFilter);
      if (priorityFilter) params.append("priority", priorityFilter);

      const response = await api.get(`/incidents?${params.toString()}`);
      setIncidents(response.data.data);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error("Failed to fetch incidents:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, severityFilter, priorityFilter, sortBy, sortDesc]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleEditClick = (incident) => {
    setEditingIncident(incident);
    setEditStatus(incident.status);
    setEditAssignedTo(incident.assigned_to || "");
    setEditNotes(incident.notes || "");
  };

  const handleUpdate = async () => {
    if (!editingIncident) return;
    try {
      await api.patch(`/incidents/${editingIncident.id}`, {
        status: editStatus,
        assigned_to: editAssignedTo,
        notes: editNotes,
      });
      setEditingIncident(null);
      fetchIncidents();
    } catch (error) {
      console.error("Failed to update incident:", error);
    }
  };

  const handleCloseIncident = async (id) => {
    try {
      await api.patch(`/incidents/${id}`, { status: "Closed" });
      fetchIncidents();
    } catch (error) {
      console.error("Failed to close incident:", error);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setSeverityFilter("");
    setPriorityFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incident Management"
        description="Monitor, assign, and resolve security incidents."
      />

      {/* Filters and Controls */}
      <section className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-md md:flex-row md:items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Search</label>
          <input
            type="text"
            placeholder="Search by ID, Flow ID, Threat..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full space-y-1 md:w-40">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <div className="w-full space-y-1 md:w-40">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Severity</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div className="w-full space-y-1 md:w-40">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Priority</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <button
          onClick={clearFilters}
          className="h-[38px] rounded-lg border border-slate-700 px-4 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Clear
        </button>
      </section>

      {/* Incidents Table */}
      <section className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Incident ID</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Threat / Prediction</th>
                <th className="px-6 py-4 font-semibold">Severity / Risk</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Assigned To</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                      <span>Loading incidents...</span>
                    </div>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-slate-500">
                    No incidents found matching your criteria.
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      <div className="truncate w-24" title={incident.id}>{incident.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(incident.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{incident.threat_category}</div>
                      <div className="text-xs text-slate-500">{incident.prediction}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${severityColors[incident.severity] || "text-slate-400"}`}>
                        {incident.severity}
                      </div>
                      <div className="text-xs text-slate-500">Risk: {incident.risk_score}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityColors[incident.priority] || "bg-slate-700 text-white"}`}>
                        {incident.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[incident.status] || statusColors.Open}`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {incident.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                            {incident.assigned_to.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-slate-300">{incident.assigned_to}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(incident)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                          title="Edit Incident"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {incident.status !== "Closed" && (
                          <button
                            onClick={() => handleCloseIncident(incident.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors"
                            title="Close Incident"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-white/5 px-6 py-4 text-sm text-slate-400">
          <div>
            Showing <span className="font-medium text-white">{incidents.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium text-white">{Math.min(page * limit, total)}</span> of <span className="font-medium text-white">{total}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1 font-medium text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || pages === 0}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1 font-medium text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      {editingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Update Incident</h3>
              <button
                onClick={() => setEditingIncident(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Assign To</label>
                <input
                  type="text"
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  placeholder="e.g. jdoe"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-400">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows="4"
                  placeholder="Add your investigation notes here..."
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingIncident(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
