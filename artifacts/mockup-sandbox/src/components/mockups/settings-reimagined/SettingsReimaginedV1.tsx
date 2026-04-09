import { useState } from "react";
import {
  Users, Layers, Mail, Calculator, Bell,
  Shield, Crown, UserRound, Plus, Pencil,
  Trash2, Copy, Check, X, ChevronRight,
  GitBranch, Settings,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────
const MEMBERS = [
  { id: 1, name: "Art Tsymbal",      email: "art@artk.ai",     role: "director", subTeams: ["Product", "Design"] },
  { id: 2, name: "Olena Melnyk",     email: "olena@artk.ai",   role: "lead",     subTeams: ["Engineering"] },
  { id: 3, name: "Ivan Kovalenko",   email: "ivan@artk.ai",    role: "member",   subTeams: ["Engineering"] },
  { id: 4, name: "Maria Petrenko",   email: "maria@artk.ai",   role: "member",   subTeams: ["Design"] },
  { id: 5, name: "Dmytro Savchenko", email: "dmytro@artk.ai",  role: "lead",     subTeams: ["Product"] },
];

const PENDING = [
  { id: 1, email: "ksenia@artk.ai",  role: "member" },
  { id: 2, email: "andrii@artk.ai",  role: "lead" },
];

const SUB_TEAMS = [
  { id: 1, name: "Engineering", color: "#6366f1", count: 2 },
  { id: 2, name: "Design",      color: "#ec4899", count: 2 },
  { id: 3, name: "Product",     color: "#f59e0b", count: 2 },
];

const ALLOWED = [
  { id: 1, email: "art@artk.ai" },
  { id: 2, email: "olena@artk.ai" },
  { id: 3, email: "*@artk.ai (domain)" },
];

// ─── Nav structure ────────────────────────────────────────────
const NAV = [
  {
    group: "Team",
    items: [
      { id: "members",    label: "Members",       icon: Users,      badge: `${MEMBERS.length}` },
      { id: "subteams",   label: "Sub-teams",     icon: Layers,     badge: `${SUB_TEAMS.length}` },
      { id: "assignments",label: "Assignments",   icon: GitBranch,  badge: null },
    ],
  },
  {
    group: "Access",
    items: [
      { id: "emails",     label: "Allowed Emails", icon: Mail,       badge: null },
    ],
  },
  {
    group: "Pulse",
    items: [
      { id: "scoring",    label: "Scoring",        icon: Calculator, badge: null },
      { id: "reminders",  label: "Reminders",      icon: Bell,       badge: null },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────
function RoleIcon({ role }: { role: string }) {
  if (role === "director") return <Crown size={13} className="text-amber-500" />;
  if (role === "lead")     return <Shield size={13} className="text-blue-500" />;
  return <UserRound size={13} className="text-slate-400" />;
}

function RoleBadge({ role }: { role: string }) {
  const cfg = {
    director: { label: "Director",  bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
    lead:     { label: "Team Lead", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"  },
    member:   { label: "Teammate",  bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200" },
  }[role] ?? { label: role, bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <RoleIcon role={role} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${s} rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 shrink-0`}>
      {name.charAt(0)}
    </div>
  );
}

function SubTeamPip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
      <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
      {name}
    </span>
  );
}

// ─── Section: Members ─────────────────────────────────────────
function MembersPanel() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Section header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Members</h2>
          <p className="text-sm text-slate-500 mt-0.5">{MEMBERS.length} active members · {PENDING.length} pending invitations</p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus size={15} />
          Invite
        </button>
      </div>

      {/* Invite panel */}
      {showInvite && (
        <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">Send invitations</p>
            <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10"
              placeholder="Enter emails separated by commas"
            />
            <select className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none">
              <option>Teammate</option>
              <option>Team Lead</option>
              <option>Director</option>
            </select>
            <button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
              Send
            </button>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {PENDING.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pending</p>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 divide-y divide-amber-100">
            {PENDING.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                    <Mail size={15} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.email}</p>
                    <p className="text-xs text-amber-600">Awaiting acceptance · {inv.role === "lead" ? "Team Lead" : "Teammate"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors" title="Copy invite link">
                    <Copy size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Cancel invitation">
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active</p>
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
          {MEMBERS.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors group">
              <Avatar name={m.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                  {m.id === 1 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">You</span>}
                </div>
                <p className="text-xs text-slate-400 truncate">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden group-hover:flex items-center gap-1">
                  {m.subTeams.map((st) => {
                    const found = SUB_TEAMS.find((s) => s.name === st);
                    return <SubTeamPip key={st} name={st} color={found?.color ?? "#888"} />;
                  })}
                </div>
                <div className="flex group-hover:hidden items-center gap-1">
                  {m.subTeams.slice(0, 2).map((st) => {
                    const found = SUB_TEAMS.find((s) => s.name === st);
                    return <SubTeamPip key={st} name={st} color={found?.color ?? "#888"} />;
                  })}
                </div>
                <RoleBadge role={m.role} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {m.id !== 1 && (
                  <>
                    <select className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs text-slate-700 outline-none">
                      <option selected={m.role === "member"}>Teammate</option>
                      <option selected={m.role === "lead"}>Team Lead</option>
                      <option selected={m.role === "director"}>Director</option>
                    </select>
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Sub-teams ───────────────────────────────────────
function SubTeamsPanel() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Sub-teams</h2>
          <p className="text-sm text-slate-500 mt-0.5">Group teammates for filtered insights and reporting</p>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
          <Plus size={15} />
          New sub-team
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SUB_TEAMS.map((st) => (
          <div key={st.id} className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: st.color + "20" }}>
                <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: st.color }} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"><Pencil size={12} /></button>
                <button className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={12} /></button>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-900">{st.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{st.count} members</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              {MEMBERS.filter((m) => m.subTeams.includes(st.name)).map((m) => (
                <div key={m.id} className="flex items-center gap-1.5 mb-1 last:mb-0">
                  <Avatar name={m.name} size="sm" />
                  <span className="text-xs text-slate-600">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-colors min-h-[140px]">
          <Plus size={20} />
          <span className="text-sm font-medium">Add sub-team</span>
        </button>
      </div>
    </div>
  );
}

// ─── Section: Assignments ──────────────────────────────────────
function AssignmentsPanel() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>
        <p className="text-sm text-slate-500 mt-0.5">Map each member to their sub-teams</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid border-b border-slate-100 bg-slate-50 px-4 py-2.5" style={{ gridTemplateColumns: "1fr repeat(3, auto)" }}>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</span>
          {SUB_TEAMS.map((st) => (
            <span key={st.id} className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-28 text-center">{st.name}</span>
          ))}
        </div>
        {MEMBERS.map((m) => (
          <div key={m.id} className="grid border-b border-slate-100 last:border-0 px-4 py-3 items-center hover:bg-slate-50/60 transition-colors" style={{ gridTemplateColumns: "1fr repeat(3, auto)" }}>
            <div className="flex items-center gap-3">
              <Avatar name={m.name} />
              <div>
                <p className="text-sm font-medium text-slate-900">{m.name}</p>
                <p className="text-xs text-slate-400">{m.role === "director" ? "Director" : m.role === "lead" ? "Team Lead" : "Teammate"}</p>
              </div>
            </div>
            {SUB_TEAMS.map((st) => {
              const assigned = m.subTeams.includes(st.name);
              return (
                <div key={st.id} className="w-28 flex justify-center">
                  <button
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      assigned ? "border-slate-900 bg-slate-900" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {assigned && <Check size={12} className="text-white" strokeWidth={3} />}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Allowed Emails ───────────────────────────────────
function AllowedEmailsPanel() {
  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Allowed Emails</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control which email addresses can sign in to Artkai Pulse</p>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10"
          placeholder="name@artk.ai or *@domain.com"
        />
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {ALLOWED.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Mail size={14} className="text-slate-500" />
              </div>
              <span className="text-sm font-medium text-slate-800">{a.email}</span>
            </div>
            <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Scoring ─────────────────────────────────────────
function ScoringPanel() {
  const [mode, setMode] = useState("latest_only");
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Scoring</h2>
        <p className="text-sm text-slate-500 mt-0.5">Choose how pulse scores are calculated from check-in responses</p>
      </div>
      <div className="space-y-3">
        {[
          {
            id: "latest_only",
            title: "Latest response only",
            desc: "Only the most recent check-in from each member contributes to the team score. Best for tracking current sentiment.",
          },
          {
            id: "average_all",
            title: "Average all responses",
            desc: "All check-ins within the selected time window are averaged. Better for capturing trends over time.",
          },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
              mode === opt.id
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 hover:border-slate-300 bg-white"
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              mode === opt.id ? "border-slate-900 bg-slate-900" : "border-slate-300"
            }`}>
              {mode === opt.id && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{opt.title}</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
          Save changes
        </button>
      </div>
    </div>
  );
}

// ─── Section: Reminders ────────────────────────────────────────
function RemindersPanel() {
  const [enabled, setEnabled] = useState(true);
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Reminders</h2>
        <p className="text-sm text-slate-500 mt-0.5">Automatically email members when it's time to complete their pulse check-in</p>
      </div>
      <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Email reminders</p>
            <p className="text-xs text-slate-400 mt-0.5">Send weekly email prompts to all team members</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? "bg-slate-900" : "bg-slate-200"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {enabled && (
          <>
            <div className="h-px bg-slate-100" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Day of week</label>
                <select className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none">
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option selected>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Time</label>
                <select className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 outline-none">
                  <option>9:00 AM</option>
                  <option selected>10:00 AM</option>
                  <option>11:00 AM</option>
                  <option>12:00 PM</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
                Save changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────
const PANELS: Record<string, () => JSX.Element> = {
  members:     MembersPanel,
  subteams:    SubTeamsPanel,
  assignments: AssignmentsPanel,
  emails:      AllowedEmailsPanel,
  scoring:     ScoringPanel,
  reminders:   RemindersPanel,
};

export function SettingsReimaginedV1() {
  const [active, setActive] = useState("members");
  const Panel = PANELS[active] ?? MembersPanel;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Left sidebar nav ── */}
      <aside className="w-56 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo bar */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold">A</div>
          <span className="text-sm font-semibold text-slate-800">Settings</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {NAV.map(({ group, items }) => (
            <div key={group}>
              <p className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group}</p>
              {items.map(({ id, label, icon: Icon, badge }) => {
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={15} className={isActive ? "text-slate-900" : "text-slate-400"} />
                    <span className="flex-1 text-left">{label}</span>
                    {badge && (
                      <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">Art Tsymbal</p>
              <p className="text-[10px] text-slate-400">Director</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <Panel />
        </div>
      </main>
    </div>
  );
}
