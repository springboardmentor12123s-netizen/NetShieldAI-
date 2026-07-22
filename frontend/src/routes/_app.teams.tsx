import { useAuth } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { Users, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/teams")({
  component: TeamsPage,
});

function TeamsPage() {
    const { user } = useAuth();
const isAdmin = user?.role === "Admin";
  const [teams, setTeams] = useState<any[]>([]);

  const [teamName, setTeamName] = useState("");
  const [leader, setLeader] = useState("");
  const [members, setMembers] = useState("");

  async function loadTeams() {
    const res = await axios.get("http://localhost:8000/teams");
    setTeams(res.data);
  }

  useEffect(() => {
    loadTeams();
  }, []);

  async function createTeam() {
    if (!teamName || !leader || !members) {
      alert("Fill all fields");
      return;
    }

    await axios.post("http://localhost:8000/teams", {
      team_name: teamName,
      leader,
      members: members.split(",").map((m) => m.trim()),
    });

    setTeamName("");
    setLeader("");
    setMembers("");

    loadTeams();
    alert("Team Created Successfully");
  }

  async function deleteTeam(id: number) {
    if (!window.confirm("Delete this team?")) return;

await axios.delete(`http://localhost:8000/teams/${id}`);
alert("Team Deleted Successfully");
    loadTeams();
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="text-cyan-400" />
          Team Management
        </h1>

        <p className="text-slate-400 mt-2">
          Manage Security Teams
          <p className="text-yellow-400 mt-2">
  Logged in as: {user?.role}
</p>
        </p>
        <p className="text-cyan-400 font-semibold mt-2">
  Total Teams: {teams.length}
</p>
      </div>

      <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">

        <h2 className="text-xl font-semibold mb-4">
          Create New Team
        </h2>

        <div className="grid grid-cols-3 gap-4">

          <input
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-slate-800 rounded-lg p-3"
          />

          <input
            placeholder="Leader"
            value={leader}
            onChange={(e) => setLeader(e.target.value)}
            className="bg-slate-800 rounded-lg p-3"
          />

          <input
            placeholder="Members (comma separated)"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
            className="bg-slate-800 rounded-lg p-3"
          />

        </div>

        {isAdmin && (
  <button
    onClick={createTeam}
    className="mt-5 bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
  >
    <Plus size={18} />
    Create Team
  </button>
)}

      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {teams.map((team) => (

          <div
            key={team.id}
            className="bg-slate-900 rounded-xl border border-slate-700 p-6"
          >

            <div className="flex justify-between items-start">

              <div>

                <h2 className="text-2xl font-bold">
                  {team.team_name}
                </h2>

                <p className="text-slate-400 mt-2">
                  Leader : {team.leader}
                </p>

                <p className="mt-4 text-slate-300">
                  Members:
                </p>

                <ul className="list-disc ml-5 mt-2">

                  {team.members.map((m: string) => (

                    <li key={m}>
                      {m}
                    </li>

                  ))}

                </ul>

              </div>

              {isAdmin && (
  <button
    onClick={() => deleteTeam(team.id)}
    className="bg-red-500 hover:bg-red-400 p-2 rounded-lg"
  >
    <Trash2 size={18} />
  </button>
)}

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}