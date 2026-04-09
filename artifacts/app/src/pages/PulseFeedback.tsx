import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DimensionBadge, getPillarLabel } from "@/components/ui/dimension-badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRole } from "@/context/RoleContext";
import { apiFetch, apiUrl, fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn, parseFollowUpContent } from "@/lib/utils";
import {
  BiSolidMessageRounded,
  BiSolidLeftArrow,
  BiSolidSend,
  BiSolidTime,
  BiSolidCheckCircle,
  BiSolidChevronRight,
  BiSolidChevronDown,
  BiSolidShield,
  BiSolidUser,
  BiSolidLock,
} from "react-icons/bi";

type ThreadInGroup = {
  id: number;
  anonLabel: string;
  status: string;
  createdAt: string;
  messageCount: number;
  lastActivity: string | null;
  hasLeadReply: boolean;
};

type TopicGroup = {
  topic: string;
  pillar: string;
  questionId: number | null;
  threads: ThreadInGroup[];
};

type ThreadMessage = {
  id: number;
  threadId: number;
  content: string;
  authorRole: string;
  createdAt: string;
};

type ThreadDetail = {
  thread: {
    id: number;
    pillar: string;
    topic: string;
    status: string;
    questionId: number | null;
    createdAt: string;
  };
  messages: ThreadMessage[];
};

export default function PulseFeedback() {
  const { role, userId } = useRole();
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [selectedAnonLabel, setSelectedAnonLabel] = useState<string>("");
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [replyText, setReplyText] = useState("");
  const [filterPillar, setFilterPillar] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: topicGroups, isLoading } = useQuery<TopicGroup[]>({
    queryKey: ["intent-threads", userId],
    queryFn: () => apiFetch<TopicGroup[]>("/api/intent-threads"),
    enabled: role === "lead" || role === "director",
  });

  const { data: threadDetail } = useQuery<ThreadDetail>({
    queryKey: ["intent-thread-detail", selectedThread, userId],
    queryFn: () => apiFetch<ThreadDetail>(`/api/intent-threads/${selectedThread}/messages`),
    enabled: !!selectedThread && (role === "lead" || role === "director"),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: number; content: string }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/intent-threads/${threadId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!resp.ok) throw new Error("Failed to send reply");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["intent-thread-detail", selectedThread] });
      queryClient.invalidateQueries({ queryKey: ["intent-threads"] });
      setReplyText("");
      toast({ title: "Reply sent" });
    },
    onError: () => {
      toast({ title: "Failed to send reply", variant: "destructive" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ threadId, status }: { threadId: number; status: string }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/intent-threads/${threadId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!resp.ok) throw new Error("Failed to update status");
      return resp.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["intent-thread-detail", selectedThread] });
      queryClient.invalidateQueries({ queryKey: ["intent-threads"] });
      const label = status === "resolved" ? "Thread resolved" : status === "acknowledged" ? "Thread acknowledged" : "Status updated";
      toast({ title: label });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  if (role !== "lead" && role !== "director") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 bg-secondary rounded-2xl mx-auto flex items-center justify-center">
              <BiSolidLock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-medium text-foreground">Lead Access Only</h2>
            <p className="text-muted-foreground">Switch to the Lead role to access Pulse Feedback.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const filteredGroups = topicGroups?.filter((g) => !filterPillar || g.pillar === filterPillar) ?? [];
  const pillarsWithTopics = [...new Set(topicGroups?.map((g) => g.pillar) ?? [])];
  const totalThreads = topicGroups?.reduce((sum, g) => sum + g.threads.length, 0) ?? 0;

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  const content = () => {
    if (selectedThread && threadDetail) {
      return (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <button
            onClick={() => { setSelectedThread(null); setSelectedAnonLabel(""); }}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <BiSolidLeftArrow className="w-4 h-4" />
            Back to Threads
          </button>

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <DimensionBadge dimension={threadDetail.thread.pillar} />
              {selectedAnonLabel && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800">
                  {selectedAnonLabel}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-medium text-foreground leading-tight">
              {threadDetail.thread.topic}
            </h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={threadDetail.thread.status} />
              <span className="text-sm text-muted-foreground">
                {threadDetail.messages.length} {threadDetail.messages.length === 1 ? "message" : "messages"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-8">
            {["open", "acknowledged", "resolved"].map((s) => (
              <Button
                key={s}
                variant={threadDetail.thread.status === s ? "default" : "outline"}
                size="sm"
                onClick={() => statusMutation.mutate({ threadId: selectedThread, status: s })}
                disabled={statusMutation.isPending}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>

          <div className="space-y-4 mb-8">
            {threadDetail.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.authorRole === "lead" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-4 space-y-2",
                    msg.authorRole === "lead"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border-2 border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.authorRole === "lead" ? (
                      <BiSolidShield className="w-3.5 h-3.5" />
                    ) : (
                      <BiSolidUser className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      msg.authorRole === "lead" ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {msg.authorRole === "lead" ? "You (Lead)" : selectedAnonLabel || "Anonymous Member"}
                    </span>
                  </div>
                  {(() => {
                    const parsed = parseFollowUpContent(msg.content);
                    if (parsed.isStructured) {
                      return (
                        <div className="space-y-2">
                          {parsed.selected.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {parsed.selected.map((opt) => (
                                <span key={opt} className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-medium border",
                                  msg.authorRole === "lead"
                                    ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                                    : "bg-secondary text-foreground border-border"
                                )}>
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                          {parsed.other && (
                            <p className={cn(
                              "text-sm leading-relaxed",
                              msg.authorRole === "lead" ? "text-primary-foreground" : "text-foreground"
                            )}>
                              <span className={cn(
                                "text-xs font-medium",
                                msg.authorRole === "lead" ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>Other: </span>
                              {parsed.other}
                            </p>
                          )}
                          {parsed.comment && (
                            <p className={cn(
                              "text-sm leading-relaxed italic",
                              msg.authorRole === "lead" ? "text-primary-foreground/90" : "text-muted-foreground"
                            )}>
                              "{parsed.comment}"
                            </p>
                          )}
                        </div>
                      );
                    }
                    return (
                      <p className={cn(
                        "text-sm leading-relaxed",
                        msg.authorRole === "lead" ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {msg.content}
                      </p>
                    );
                  })()}
                  <p className={cn(
                    "text-[10px]",
                    msg.authorRole === "lead" ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Reply to this thread as the team lead..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px] flex-1"
                />
                <Button
                  size="lg"
                  onClick={() => replyMutation.mutate({ threadId: selectedThread, content: replyText })}
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="self-end"
                >
                  <BiSolidSend className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Your reply is private to this anonymous member's thread only
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 pb-24 md:pb-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-medium text-foreground tracking-tight">
            Pulse Feedback
          </h1>
          <p className="text-muted-foreground">
            Anonymous qualitative feedback from your team's check-ins, grouped by topic. Each thread is a private channel with one anonymous team member.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !topicGroups || topicGroups.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-secondary rounded-2xl mx-auto flex items-center justify-center mb-4">
                <BiSolidMessageRounded className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No feedback yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                When team members share qualitative feedback during check-ins, their anonymous responses will appear here grouped by topic.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setFilterPillar(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  !filterPillar
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                )}
              >
                All ({totalThreads})
              </button>
              {pillarsWithTopics.map((p) => {
                const count = topicGroups.filter((g) => g.pillar === p).reduce((s, g) => s + g.threads.length, 0);
                return (
                  <button
                    key={p}
                    onClick={() => setFilterPillar(filterPillar === p ? null : p)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                      filterPillar === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >
                    {getPillarLabel(p)} ({count})
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const key = `${group.pillar}::${group.topic}`;
                const isExpanded = expandedTopics.has(key);
                const unrepliedCount = group.threads.filter((t) => !t.hasLeadReply).length;
                const totalMsgs = group.threads.reduce((s, t) => s + t.messageCount, 0);

                return (
                  <Card key={key}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleTopic(key)}
                        className="w-full p-5 flex items-start gap-4 text-left hover:bg-secondary/30 transition-colors rounded-2xl"
                      >
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <DimensionBadge dimension={group.pillar} />
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-secondary text-foreground border-border">
                              {group.threads.length} {group.threads.length === 1 ? "thread" : "threads"}
                            </span>
                            {unrepliedCount > 0 && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                                {unrepliedCount} unreplied
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-foreground leading-snug">
                            {group.topic}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BiSolidMessageRounded className="w-3.5 h-3.5" />
                              {totalMsgs} total {totalMsgs === 1 ? "message" : "messages"}
                            </span>
                          </div>
                        </div>
                        <BiSolidChevronDown className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 mt-1",
                          isExpanded && "rotate-180"
                        )} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border px-5 pb-4 pt-2 space-y-2">
                          {group.threads.map((thread) => (
                            <div
                              key={thread.id}
                              onClick={() => { setSelectedThread(thread.id); setSelectedAnonLabel(thread.anonLabel); }}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-all group/thread"
                            >
                              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0">
                                <BiSolidUser className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">{thread.anonLabel}</span>
                                  <StatusBadge status={thread.status} />
                                  {thread.hasLeadReply && (
                                    <BiSolidCheckCircle className="w-3.5 h-3.5 text-primary" />
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                  <span>{thread.messageCount} {thread.messageCount === 1 ? "msg" : "msgs"}</span>
                                  {thread.lastActivity && (
                                    <span className="flex items-center gap-1">
                                      <BiSolidTime className="w-3 h-3" />
                                      {formatTime(thread.lastActivity)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <BiSolidChevronRight className="w-4 h-4 text-muted-foreground group-hover/thread:text-primary transition-colors flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <AppLayout>{content()}</AppLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    acknowledged: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    resolved: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-lg text-[10px] font-medium border capitalize",
      styles[status] || "bg-secondary text-secondary-foreground border-border"
    )}>
      {status}
    </span>
  );
}
