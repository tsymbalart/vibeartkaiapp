import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRole } from "@/context/RoleContext";
import { apiFetch, apiUrl, fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BiSolidHeart,
  BiSolidSend,
  BiSolidStar,
  BiSolidRocket,
  BiSolidChevronDown,
  BiCheck,
  BiSolidTrash,
} from "react-icons/bi";

type ReceivedKudo = {
  id: number;
  content: string;
  category: string;
  emoji: string;
  createdAt: string;
};

type SentKudo = {
  id: number;
  toName: string;
  content: string;
  category: string;
  emoji: string;
  createdAt: string;
};

type Teammate = {
  id: number;
  name: string;
  avatarUrl: string | null;
};

const CATEGORIES = [
  { value: "recognition", label: "Recognition", icon: BiSolidStar, desc: "Celebrate an achievement" },
  { value: "compliment", label: "Compliment", icon: BiSolidHeart, desc: "Share something kind" },
  { value: "encouragement", label: "Encouragement", icon: BiSolidRocket, desc: "Boost their spirits" },
];

const EMOJI_OPTIONS = ["🦎", "🌟", "💛", "🔥", "✨", "🎯", "💡", "🤝", "🚀", "🌱", "🎨", "💪"];

export default function Kudos() {
  const { userId } = useRole();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"received" | "send" | "sent">("received");
  const [selectedTeammate, setSelectedTeammate] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("recognition");
  const [emoji, setEmoji] = useState("🦎");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTeammateDropdown, setShowTeammateDropdown] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: received = [] } = useQuery<ReceivedKudo[]>({
    queryKey: ["kudos-received", userId],
    queryFn: () => apiFetch<ReceivedKudo[]>("/api/kudos/received"),
  });

  const { data: sent = [] } = useQuery<SentKudo[]>({
    queryKey: ["kudos-sent", userId],
    queryFn: () => apiFetch<SentKudo[]>("/api/kudos/sent"),
  });

  const { data: teammates = [] } = useQuery<Teammate[]>({
    queryKey: ["kudos-teammates", userId],
    queryFn: () => apiFetch<Teammate[]>("/api/kudos/teammates"),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const resp = await fetchWithAuth(apiUrl("/api/kudos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: selectedTeammate, content, category, emoji }),
      });
      if (!resp.ok) throw new Error("Failed to send");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kudos-sent"] });
      queryClient.invalidateQueries({ queryKey: ["kudos-received"] });
      setContent("");
      setSelectedTeammate(null);
      setCategory("recognition");
      setEmoji("🦎");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (kudoId: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/kudos/${kudoId}`), {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Failed to delete");
      return resp.json();
    },
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["kudos-received"] });
      queryClient.invalidateQueries({ queryKey: ["kudos-sent"] });
    },
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case "recognition": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
      case "compliment": return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800";
      case "encouragement": return "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800";
      default: return "bg-secondary text-foreground border-border";
    }
  };

  const selectedTeammateName = teammates.find((t) => t.id === selectedTeammate)?.name ?? "";

  return (
    <AppLayout>
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-medium text-foreground tracking-tight">
            Pulse Kudos
          </h1>
          <span className="text-2xl">🦎</span>
        </div>
        <p className="text-muted-foreground">
          Anonymous recognition, compliments & encouragement for your teammates.
        </p>
      </div>

      <div className="flex gap-2 mb-8">
        {[
          { key: "received" as const, label: `Received (${received.length})` },
          { key: "send" as const, label: "Send Kudos" },
          { key: "sent" as const, label: `Sent (${sent.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
              tab === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "received" && (
        <div className="space-y-4">
          {received.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-4xl mb-4">🦎</div>
                <h3 className="text-lg font-medium text-foreground mb-2">No kudos yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  When teammates send you anonymous recognition, it will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            received.map((kudo) => (
              <Card key={kudo.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-16 flex items-center justify-center text-3xl bg-secondary/30 flex-shrink-0">
                      {kudo.emoji}
                    </div>
                    <div className="flex-1 p-5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-medium border capitalize",
                          getCategoryStyle(kudo.category)
                        )}>
                          {kudo.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(kudo.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{kudo.content}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">From an anonymous teammate</p>
                        {confirmDeleteId === kudo.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground mr-1">Delete?</span>
                            <button
                              onClick={() => deleteMutation.mutate(kudo.id)}
                              disabled={deleteMutation.isPending}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(kudo.id)}
                            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
                            <BiSolidTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "send" && (
        <div className="max-w-2xl space-y-6">
          {showSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <BiCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Kudos sent anonymously!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">Your teammate will see it without knowing who sent it.</p>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Who's this for?</label>
                <div className="relative">
                  <button
                    onClick={() => setShowTeammateDropdown(!showTeammateDropdown)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border hover:border-primary/40 transition-colors bg-card text-left"
                  >
                    <span className={selectedTeammate ? "text-foreground" : "text-muted-foreground"}>
                      {selectedTeammateName || "Select a teammate..."}
                    </span>
                    <BiSolidChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showTeammateDropdown && "rotate-180")} />
                  </button>
                  {showTeammateDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border-2 border-border bg-card shadow-lg overflow-hidden">
                      {teammates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setSelectedTeammate(t.id); setShowTeammateDropdown(false); }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors",
                            selectedTeammate === t.id && "bg-secondary"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {t.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                        category === cat.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <cat.icon className={cn(
                        "w-5 h-5",
                        category === cat.value ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="text-xs font-medium text-foreground">{cat.label}</span>
                      <span className="text-[10px] text-muted-foreground text-center">{cat.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pick an emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2",
                        emoji === e
                          ? "border-primary bg-primary/5 scale-110"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your message</label>
                <Textarea
                  placeholder="Write something kind, encouraging, or celebrate a win..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-[10px] text-muted-foreground">
                  This will be sent anonymously — your teammate won't know who it's from
                </p>
              </div>

              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!selectedTeammate || !content.trim() || sendMutation.isPending}
                className="w-full"
                size="lg"
              >
                <BiSolidSend className="w-4 h-4 mr-2" />
                Send Anonymous Kudos
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "sent" && (
        <div className="space-y-4">
          {sent.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-medium text-foreground mb-2">No kudos sent yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Spread some love! Send anonymous recognition to your teammates.
                </p>
              </CardContent>
            </Card>
          ) : (
            sent.map((kudo) => (
              <Card key={kudo.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl flex-shrink-0">{kudo.emoji}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">To {kudo.toName}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-medium border capitalize",
                          getCategoryStyle(kudo.category)
                        )}>
                          {kudo.category}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(kudo.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{kudo.content}</p>
                    </div>
                    {confirmDeleteId === kudo.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0 self-start mt-1">
                        <span className="text-[10px] text-muted-foreground mr-1">Delete?</span>
                        <button
                          onClick={() => deleteMutation.mutate(kudo.id)}
                          disabled={deleteMutation.isPending}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(kudo.id)}
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex-shrink-0 self-start mt-1"
                      >
                        <BiSolidTrash className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </AppLayout>
  );
}
