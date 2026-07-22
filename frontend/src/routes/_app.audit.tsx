import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { ClipboardList, History } from "lucide-react";

export const Route = createFileRoute("/_app/audit")({
  component: AuditPage,
});

interface AuditLog {
  id: number;
  user: string;
  action: string;
}

function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  async function loadLogs() {
    const res = await axios.get("http://localhost:8000/audit-logs");
    setLogs(res.data);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardList className="text-cyan-400" />
          Audit Logs
        </h1>

        <p className="text-slate-400 mt-2">
          View all user activities
        </p>

        <p className="text-cyan-400 font-semibold mt-2">
          Total Logs : {logs.length}
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-800">

            <tr>

              <th className="text-left p-4">ID</th>

              <th className="text-left p-4">User</th>

              <th className="text-left p-4">Action</th>

            </tr>

          </thead>

          <tbody>

            {logs.map((log) => (

              <tr
                key={log.id}
                className="border-t border-slate-700 hover:bg-slate-800"
              >

                <td className="p-4">
                  {log.id}
                </td>

                <td className="p-4 font-semibold">
                  {log.user}
                </td>

                <td className="p-4 flex items-center gap-2">

                  <History
                    size={16}
                    className="text-cyan-400"
                  />

                  {log.action}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}