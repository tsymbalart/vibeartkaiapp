import { useState } from "react";
import { Users, Layers, GitBranch, Mail, Calculator, Bell, Plus, Trash2, Check, X, Pencil, Copy, Crown, Shield, UserRound, ChevronDown } from "lucide-react";

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

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    director: { label: "Director",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
    lead:     { label: "Team Lead", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    member:   { label: "Teammate",  cls: "bg-slate-50 text-slate-600 border-slate-200" },
  };
  const { label, cls } = map[role] ?? map.member;
  return <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${cls}`}>{label}</span>;
}

// ── Tab content ───────────────────────────────────────────────

function PeopleTab() {
  const [expandedInvite, setExpandedInvite] = useState(false);

  return (
    <div className="space-y-10">
      {/* ── Members ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Team Members</h3>
            <p className="text-sm text-slate-500 mt-0.5">{MEMBERS.length} active · {PENDING.length} pending</p>
          </div>
          <button
            onClick={() => setExpandedInvite(!expandedInvite)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Plus size={14} />
            Invite
          </button>
        </div>

        {expandedInvite && (
          <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex gap-2">
            <input className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none" placeholder="Emails, comma-separated" />
            <select className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-sm outline-none"><option>Teammate</option><option>Team Lead</option></select>
            <button className="h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium">Send</button>
            <button onClick={() => setExpandedInvite(false)} className="h-9 px-2 rounded-lg text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
        )}

        {PENDING.length > 0 && (
          <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 divide-y divide-amber-100">
            {PENDING.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center"><Mail size={14} className="text-amber-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.email}</p>
                    <p className="text-xs text-amber-600">Pending · {p.role === "lead" ? "Team Lead" : "Teammate"}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"><Copy size={13} /></button>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><X size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {MEMBERS.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 group">
              <Avatar name={m.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-slate-900">{m.name}</p>
                  {m.id === 1 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">You</span>}
                </div>
                <p className="text-xs text-slate-400">{m.email}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {m.subTeams.map((sid) => { const st = SUB_TEAMS.find((s) => s.id === sid)!; return (
                  <span key={sid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                    <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: st.color }} />{st.name}
                  </span>
                ); })}
                <RoleBadge role={m.role} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                {m.id !== 1 && <>
                  <select className="h-7 px-2 rounded-md border border-slate-200 bg-white text-xs outline-none text-slate-700">
                    <option>Teammate</option><option>Team Lead</option><option>Director</option>
                  </select>
                  <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                </>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-slate-200" />

      {/* ── Sub-teams ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Sub-teams</h3>
            <p className="text-sm text-slate-500 mt-0.5">Group members for filtered insights and reporting</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Plus size={14} />New
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {SUB_TEAMS.map((st) => (
            <div key={st.id} className="p-4 rounded-xl border border-slate-200 bg-white group hover:border-slate-300">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: st.color + "20" }}>
                  <div className="w-3 h-3 rounded-sm" style={{ background: st.color }} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button className="p-1 rounded text-slate-400 hover:text-slate-700"><Pencil size={12} /></button>
                  <button className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-900">{st.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{MEMBERS.filter(m => m.subTeams.includes(st.id)).length} members</p>
            </div>
          ))}
          <button className="p-4 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-slate-300 hover:text-slate-600 min-h-[100px]">
            <Plus size={18} /><span className="text-sm">Add</span>
          </button>
        </div>
      </section>

      <div className="border-t border-slate-200" />

      {/* ── Assignments matrix ── */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">Assignments</h3>
          <p className="text-sm text-slate-500 mt-0.5">Map each member to their sub-teams</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="grid bg-slate-50 border-b border-slate-200 px-4 py-2.5" style={{ gridTemplateColumns: "1fr repeat(3, 120px)" }}>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member</span>
            {SUB_TEAMS.map((st) => (
              <span key={st.id} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{st.name}</span>
            ))}
          </div>
          {MEMBERS.map((m) => (
            <div key={m.id} className="grid border-b border-slate-100 last:border-0 px-4 py-3 items-center hover:bg-slate-50/50" style={{ gridTemplateColumns: "1fr repeat(3, 120px)" }}>
              <div className="flex items-center gap-2.5">
                <Avatar name={m.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{m.role === "lead" ? "Team Lead" : m.role === "director" ? "Director" : "Teammate"}</p>
                </div>
              </div>
              {SUB_TEAMS.map((st) => {
                const on = m.subTeams.includes(st.id);
                return (
                  <div key={st.id} className="flex justify-center">
                    <button className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${on ? "bg-slate-900 border-slate-900" : "border-slate-300 hover:border-slate-500"}`}>
                      {on && <Check size={11} className="text-white" strokeWidth={3} />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PulseTab() {
  const [mode, setMode] = useState("latest_only");
  const [reminderOn, setReminderOn] = useState(true);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">Scoring</h3>
          <p className="text-sm text-slate-500 mt-0.5">How pulse scores are calculated from check-in responses</p>
        </div>
        <div className="space-y-3">
          {[{ id: "latest_only", title: "Latest response only", desc: "Only the most recent check-in from each member contributes to the team score." },
            { id: "average_all", title: "Average all responses", desc: "All check-ins within the time window are averaged for trend tracking." }
          ].map((o) => (
            <button key={o.id} onClick={() => setMode(o.id)}
              className={`w-full flex gap-4 items-start p-4 rounded-xl border-2 text-left transition-all ${mode === o.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className={`w-4.5 h-4.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${mode === o.id ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                {mode === o.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{o.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{o.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">Save</button>
        </div>
      </section>

      <div className="border-t border-slate-200" />

      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">Reminders</h3>
          <p className="text-sm text-slate-500 mt-0.5">Weekly email prompts sent to all team members</p>
        </div>
        <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Email reminders</p>
              <p className="text-xs text-slate-400 mt-0.5">Send automatic weekly nudges</p>
            </div>
            <button onClick={() => setReminderOn(!reminderOn)} className={`w-11 h-6 rounded-full relative transition-colors ${reminderOn ? "bg-slate-900" : "bg-slate-200"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${reminderOn ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {reminderOn && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Day</label>
                <select className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"><option>Monday</option><option>Wednesday</option><option>Friday</option></select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Time</label>
                <select className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none"><option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option></select>
              </div>
              <div className="col-span-2 flex justify-end">
                <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium">Save</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function AccessTab() {
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-5">
          <h3 className="text-base font-semibold text-slate-900">Allowed Emails</h3>
          <p className="text-sm text-slate-500 mt-0.5">Control which email addresses can sign in to Artkai Pulse</p>
        </div>
        <div className="flex gap-2 mb-4">
          <input className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none" placeholder="name@artk.ai or *@domain.com" />
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium"><Plus size={14} />Add</button>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
          {["art@artk.ai", "olena@artk.ai", "*@artk.ai (domain)"].map((email) => (
            <div key={email} className="flex items-center justify-between px-4 py-3 group hover:bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center"><Mail size={14} className="text-slate-500" /></div>
                <span className="text-sm font-medium text-slate-800">{email}</span>
              </div>
              <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Tabs config ────────────────────────────────────────────────
const TABS = [
  { id: "people", label: "People", icon: Users, content: PeopleTab, meta: `${MEMBERS.length} members` },
  { id: "pulse",  label: "Pulse",  icon: Calculator, content: PulseTab, meta: "Scoring · Reminders" },
  { id: "access", label: "Access", icon: Mail, content: AccessTab, meta: "Director only" },
];

export function OptionA() {
  const [active, setActive] = useState("people");
  const tab = TABS.find((t) => t.id === active)!;
  const Panel = tab.content;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* App shell header */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center px-6 gap-3">
        <div className="w-6 h-6 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">A</div>
        <span className="text-sm font-semibold text-slate-800">Settings</span>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <Panel />
        </div>
      </div>
    </div>
  );
}
