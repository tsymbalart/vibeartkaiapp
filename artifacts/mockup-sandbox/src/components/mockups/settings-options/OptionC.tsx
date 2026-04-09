import { useState } from "react";
import { Users, Layers, GitBranch, Mail, Calculator, Bell, Plus, Trash2, Check, X, Pencil, Copy, ChevronLeft, ArrowRight } from "lucide-react";

const MEMBERS = [
  { id: 1, name: "Art Tsymbal",      email: "art@artk.ai",    role: "director", subTeams: [1, 3] },
  { id: 2, name: "Olena Melnyk",     email: "olena@artk.ai",  role: "lead",     subTeams: [2] },
  { id: 3, name: "Ivan Kovalenko",   email: "ivan@artk.ai",   role: "member",   subTeams: [2] },
  { id: 4, name: "Maria Petrenko",   email: "maria@artk.ai",  role: "member",   subTeams: [1] },
  { id: 5, name: "Dmytro Savchenko", email: "dmytro@artk.ai", role: "lead",     subTeams: [3] },
];
const PENDING = [
  { id: 1, email: "ksenia@artk.ai", role: "member" },
  { id: 2, email: "andrii@artk.ai", role: "lead" },
];
const SUB_TEAMS = [
  { id: 1, name: "Design",      color: "#ec4899" },
  { id: 2, name: "Engineering", color: "#6366f1" },
  { id: 3, name: "Product",     color: "#f59e0b" },
];

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-sm";
  return (
    <div className={`${cls} rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 shrink-0`}>
      {name.charAt(0)}
    </div>
  );
}

// ── Category cards config ─────────────────────────────────────
const CATEGORIES = [
  {
    id: "team",
    label: "Team",
    icon: Users,
    description: "Members, roles, and sub-team structure",
    color: "#6366f1",
    bg: "bg-indigo-50",
    items: ["5 active members", "2 pending invites", "3 sub-teams"],
  },
  {
    id: "pulse",
    label: "Pulse",
    icon: Calculator,
    description: "Scoring logic and reminder schedule",
    color: "#10b981",
    bg: "bg-emerald-50",
    items: ["Scoring: Latest only", "Reminders: Wednesdays 10am"],
  },
  {
    id: "access",
    label: "Access",
    icon: Mail,
    description: "Control who can sign in to Artkai Pulse",
    color: "#f59e0b",
    bg: "bg-amber-50",
    items: ["3 allowed emails / domains"],
    badge: "Director only",
  },
];

// ── Detail: Team ──────────────────────────────────────────────
function TeamDetail() {
  const [subView, setSubView] = useState<"members" | "subteams" | "assignments">("members");
  const [mode, setMode] = useState("latest_only");

  const SubNav = () => (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 self-start">
      {(["members", "subteams", "assignments"] as const).map((v) => (
        <button key={v} onClick={() => setSubView(v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${subView === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
          {v === "subteams" ? "Sub-teams" : v === "assignments" ? "Assignments" : "Members"}
        </button>
      ))}
    </div>
  );

  if (subView === "members") return (
    <>
      <SubNav />
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{MEMBERS.length} active · {PENDING.length} pending</p>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium"><Plus size={13} />Invite</button>
      </div>
      {PENDING.length > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 divide-y divide-amber-100">
          {PENDING.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center"><Mail size={13} className="text-amber-600" /></div>
                <div><p className="text-sm font-medium text-slate-800">{p.email}</p><p className="text-xs text-amber-600">Pending</p></div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded text-slate-400 hover:text-slate-600"><Copy size={12} /></button>
                <button className="p-1.5 rounded text-slate-400 hover:text-red-500"><X size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {MEMBERS.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-slate-50/60">
            <Avatar name={m.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-slate-900">{m.name}</p>
                {m.id === 1 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">You</span>}
              </div>
              <p className="text-xs text-slate-400">{m.email}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border shrink-0 ${
              m.role === "director" ? "bg-amber-50 text-amber-700 border-amber-200"
              : m.role === "lead" ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-slate-50 text-slate-600 border-slate-200"}`}>
              {m.role === "director" ? "Director" : m.role === "lead" ? "Team Lead" : "Teammate"}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {m.id !== 1 && <><select className="h-7 px-2 rounded border border-slate-200 bg-white text-xs outline-none"><option>Teammate</option><option>Team Lead</option></select><button className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={12} /></button></>}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (subView === "subteams") return (
    <>
      <SubNav />
      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={13} />New sub-team</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SUB_TEAMS.map((st) => (
          <div key={st.id} className="p-4 rounded-xl border border-slate-200 bg-white group hover:border-slate-300">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: st.color + "20" }}>
                <div className="w-3 h-3 rounded-sm" style={{ background: st.color }} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button className="p-1 rounded text-slate-400 hover:text-slate-700"><Pencil size={11} /></button>
                <button className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 size={11} /></button>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-900">{st.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{MEMBERS.filter(m => m.subTeams.includes(st.id)).length} members</p>
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              {MEMBERS.filter(m => m.subTeams.includes(st.id)).map(m => (
                <div key={m.id} className="flex items-center gap-1.5">
                  <Avatar name={m.name} size="sm" />
                  <span className="text-xs text-slate-600">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="p-4 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-600 min-h-[130px]">
          <Plus size={18} /><span className="text-sm">Add</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <SubNav />
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid bg-slate-50 border-b border-slate-200 px-4 py-2.5" style={{ gridTemplateColumns: "1fr repeat(3, 100px)" }}>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member</span>
          {SUB_TEAMS.map((st) => <span key={st.id} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{st.name}</span>)}
        </div>
        {MEMBERS.map((m) => (
          <div key={m.id} className="grid border-b border-slate-100 last:border-0 px-4 py-3 items-center hover:bg-slate-50/50" style={{ gridTemplateColumns: "1fr repeat(3, 100px)" }}>
            <div className="flex items-center gap-2.5">
              <Avatar name={m.name} size="sm" />
              <p className="text-sm font-medium text-slate-900">{m.name}</p>
            </div>
            {SUB_TEAMS.map((st) => {
              const on = m.subTeams.includes(st.id);
              return <div key={st.id} className="flex justify-center">
                <button className={`w-5 h-5 rounded border-2 flex items-center justify-center ${on ? "bg-slate-900 border-slate-900" : "border-slate-300 hover:border-slate-500"}`}>
                  {on && <Check size={11} className="text-white" strokeWidth={3} />}
                </button>
              </div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Detail: Pulse ─────────────────────────────────────────────
function PulseDetail() {
  const [mode, setMode] = useState("latest_only");
  const [reminderOn, setReminderOn] = useState(true);
  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Scoring mode</h4>
        <div className="space-y-2">
          {[{ id: "latest_only", title: "Latest response only", desc: "Most recent check-in per member contributes to the score." },
            { id: "average_all", title: "Average all responses", desc: "All check-ins in the time window are averaged." }
          ].map((o) => (
            <button key={o.id} onClick={() => setMode(o.id)} className={`w-full flex gap-3 items-start p-4 rounded-xl border-2 text-left ${mode === o.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${mode === o.id ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                {mode === o.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div><p className="text-sm font-semibold text-slate-900">{o.title}</p><p className="text-sm text-slate-500 mt-0.5">{o.desc}</p></div>
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-3"><button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">Save</button></div>
      </div>
      <div className="border-t border-slate-200 pt-8">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Email reminders</h4>
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-semibold text-slate-900">Send weekly reminders</p><p className="text-xs text-slate-400 mt-0.5">Prompt members to complete check-ins</p></div>
            <button onClick={() => setReminderOn(!reminderOn)} className={`w-11 h-6 rounded-full relative transition-colors ${reminderOn ? "bg-slate-900" : "bg-slate-200"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${reminderOn ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {reminderOn && <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Day</label><select className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"><option>Wednesday</option></select></div>
            <div><label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Time</label><select className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"><option>10:00 AM</option></select></div>
            <div className="col-span-2 flex justify-end"><button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">Save</button></div>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── Detail: Access ────────────────────────────────────────────
function AccessDetail() {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none" placeholder="name@artk.ai or *@domain.com" />
        <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium"><Plus size={13} />Add</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {["art@artk.ai", "olena@artk.ai", "*@artk.ai (domain)"].map((email) => (
          <div key={email} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center"><Mail size={13} className="text-slate-500" /></div>
              <span className="text-sm font-medium text-slate-800">{email}</span>
            </div>
            <button className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

const DETAIL_PANELS: Record<string, { title: string; desc: string; icon: any; content: () => JSX.Element }> = {
  team:   { title: "Team",   desc: "Members, roles, and sub-team structure",         icon: Users,      content: TeamDetail },
  pulse:  { title: "Pulse",  desc: "Scoring logic and email reminder schedule",       icon: Calculator, content: PulseDetail },
  access: { title: "Access", desc: "Control who can sign in to Artkai Pulse",         icon: Mail,       content: AccessDetail },
};

// ── Root ──────────────────────────────────────────────────────
export function OptionC() {
  const [view, setView] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center px-6 gap-3 shrink-0">
        <div className="w-6 h-6 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">A</div>
        {view ? (
          <>
            <button onClick={() => setView(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><ChevronLeft size={18} /></button>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-sm font-semibold text-slate-800">{DETAIL_PANELS[view].title}</span>
          </>
        ) : (
          <span className="text-sm font-semibold text-slate-800">Settings</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!view ? (
          /* ── Home grid ── */
          <div className="max-w-2xl mx-auto px-8 py-10">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-slate-500 mt-1">Manage your team, pulse logic, and access control</p>
            </div>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setView(cat.id)}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${cat.bg} flex items-center justify-center shrink-0`}>
                      <Icon size={22} style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-semibold text-slate-900">{cat.label}</p>
                        {cat.badge && <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">{cat.badge}</span>}
                      </div>
                      <p className="text-sm text-slate-500">{cat.description}</p>
                      <div className="flex gap-3 mt-2">
                        {cat.items.map((item) => (
                          <span key={item} className="text-xs text-slate-400">{item}</span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Detail view ── */
          <div className="max-w-2xl mx-auto px-8 py-8">
            {(() => {
              const panel = DETAIL_PANELS[view];
              const Icon = panel.icon;
              const Content = panel.content;
              return (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Icon size={20} className="text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{panel.title}</h2>
                      <p className="text-sm text-slate-500">{panel.desc}</p>
                    </div>
                  </div>
                  <Content />
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
