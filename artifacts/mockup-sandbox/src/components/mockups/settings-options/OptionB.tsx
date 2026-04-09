import { useState, useRef, useEffect } from "react";
import { Users, Layers, GitBranch, Mail, Calculator, Bell, Plus, Trash2, Check, X, Pencil, Copy, Crown, Shield, UserRound } from "lucide-react";

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

const SECTIONS = [
  { id: "members",     label: "Members",       group: "Team",   icon: Users },
  { id: "subteams",    label: "Sub-teams",     group: "Team",   icon: Layers },
  { id: "assignments", label: "Assignments",   group: "Team",   icon: GitBranch },
  { id: "scoring",     label: "Scoring",       group: "Pulse",  icon: Calculator },
  { id: "reminders",   label: "Reminders",     group: "Pulse",  icon: Bell },
  { id: "access",      label: "Allowed Emails",group: "Access", icon: Mail },
];

const GROUPS = ["Team", "Pulse", "Access"];

export function OptionB() {
  const [activeSection, setActiveSection] = useState("members");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const mainRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState("latest_only");
  const [reminderOn, setReminderOn] = useState(true);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const SectionAnchor = ({ id, label, icon: Icon, description, action }: {
    id: string; label: string; icon: any; description: string; action?: React.ReactNode;
  }) => (
    <section ref={(el) => { sectionRefs.current[id] = el; }} id={id} className="scroll-mt-16">
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-slate-200">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <Icon size={17} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{label}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-white border-b border-slate-200 flex items-center px-6 gap-3 shrink-0">
        <div className="w-6 h-6 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">A</div>
        <span className="text-sm font-semibold text-slate-800">Settings</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ── */}
        <aside className="w-52 shrink-0 bg-white border-r border-slate-200 overflow-y-auto py-4 px-2">
          {GROUPS.map((group) => (
            <div key={group} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}</p>
              {SECTIONS.filter((s) => s.group === group).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-0.5 transition-colors ${
                    activeSection === id
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={14} className={activeSection === id ? "text-slate-800" : "text-slate-400"} />
                  {label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ── Scrollable content ── */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8 space-y-14">

            {/* GROUP: Team ─────────────────────────── */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Team</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Members */}
              <div ref={(el) => { sectionRefs.current.members = el; }} id="members" className="scroll-mt-4 mb-10">
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Users size={16} className="text-slate-600" /></div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Members</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{MEMBERS.length} active · {PENDING.length} pending</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium"><Plus size={13} />Invite</button>
                </div>
                {PENDING.length > 0 && (
                  <div className="mb-3 rounded-xl bg-amber-50 border border-amber-100 divide-y divide-amber-100">
                    {PENDING.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center"><Mail size={13} className="text-amber-600" /></div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{p.email}</p>
                            <p className="text-xs text-amber-600">Pending · {p.role === "lead" ? "Team Lead" : "Teammate"}</p>
                          </div>
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
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
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
              </div>

              {/* Sub-teams */}
              <div ref={(el) => { sectionRefs.current.subteams = el; }} id="subteams" className="scroll-mt-4 mb-10">
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Layers size={16} className="text-slate-600" /></div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Sub-teams</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Group members for filtered reporting</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={13} />New</button>
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
                    </div>
                  ))}
                </div>
              </div>

              {/* Assignments */}
              <div ref={(el) => { sectionRefs.current.assignments = el; }} id="assignments" className="scroll-mt-4">
                <div className="mb-4 pb-4 border-b border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><GitBranch size={16} className="text-slate-600" /></div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Assignments</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Map members to sub-teams</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="grid bg-slate-50 border-b border-slate-200 px-4 py-2.5" style={{ gridTemplateColumns: "1fr repeat(3, 90px)" }}>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member</span>
                    {SUB_TEAMS.map((st) => <span key={st.id} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{st.name}</span>)}
                  </div>
                  {MEMBERS.map((m) => (
                    <div key={m.id} className="grid border-b border-slate-100 last:border-0 px-4 py-2.5 items-center hover:bg-slate-50/50" style={{ gridTemplateColumns: "1fr repeat(3, 90px)" }}>
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
              </div>
            </div>

            {/* GROUP: Pulse ─────────────────────────── */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Pulse</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div ref={(el) => { sectionRefs.current.scoring = el; }} id="scoring" className="scroll-mt-4 mb-10">
                <div className="mb-4 pb-4 border-b border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Calculator size={16} className="text-slate-600" /></div>
                  <div><h3 className="text-base font-semibold text-slate-900">Scoring</h3><p className="text-sm text-slate-500 mt-0.5">How pulse scores are calculated</p></div>
                </div>
                <div className="space-y-2">
                  {[{ id: "latest_only", title: "Latest response only", desc: "Most recent check-in per member." },
                    { id: "average_all", title: "Average all responses", desc: "All check-ins in the window averaged." }
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

              <div ref={(el) => { sectionRefs.current.reminders = el; }} id="reminders" className="scroll-mt-4">
                <div className="mb-4 pb-4 border-b border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Bell size={16} className="text-slate-600" /></div>
                  <div><h3 className="text-base font-semibold text-slate-900">Reminders</h3><p className="text-sm text-slate-500 mt-0.5">Weekly email prompts to all members</p></div>
                </div>
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-semibold text-slate-900">Email reminders</p><p className="text-xs text-slate-400 mt-0.5">Automatic weekly nudges</p></div>
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

            {/* GROUP: Access ─────────────────────────── */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Access</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div ref={(el) => { sectionRefs.current.access = el; }} id="access" className="scroll-mt-4">
                <div className="mb-4 pb-4 border-b border-slate-200 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Mail size={16} className="text-slate-600" /></div>
                  <div><h3 className="text-base font-semibold text-slate-900">Allowed Emails</h3><p className="text-sm text-slate-500 mt-0.5">Who can sign in to Artkai Pulse</p></div>
                </div>
                <div className="flex gap-2 mb-3">
                  <input className="flex-1 h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none" placeholder="name@artk.ai" />
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
