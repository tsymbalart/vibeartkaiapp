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
  BiSolidChevronRight,
  BiSolidShield,
  BiSolidUser,
  BiSolidInbox,
} from "react-icons/bi";

type FeedbackThread = {
  id: number;
  pillar: string;
  topic: string;
  status: string;
  createdAt: string;
  messageCount: number;
  lastActivity: string | null;
  hasLeadReply: boolean;
};

type FeedbackMessage = {
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
  messages: FeedbackMessage[];
};

export default function MyFeedback() {
  const { userId } = useRole();
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterPillar, setFilterPillar] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: threads, isLoading } = useQuery<FeedbackThread[]>({
    queryKey: ["my-feedback", userId],
    queryFn: () => apiFetch<FeedbackThread[]>("/api/my-feedback"),
  });

  const { data: threadDetail } = useQuery<ThreadDetail>({
    queryKey: ["my-feedback-detail", selectedThread, userId],
    queryFn: () => apiFetch<ThreadDetail>(`/api/intent-threads/${selectedThread}/messages`),
    enabled: !!selectedThread,
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
      queryClient.invalidateQueries({ queryKey: ["my-feedback-detail", selectedThread] });
      queryClient.invalidateQueries({ queryKey: ["my-feedback"] });
      setReplyText("");
      toast({ title: "Reply sent" });
    },
    onError: () => {
      toast({ title: "Failed to send reply", variant: "destructive" });
    },
  });

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

  const filteredThreads = threads?.filter((t) => !filterPillar || t.pillar === filterPillar) ?? [];
  const pillarsWithThreads = [...new Set(threads?.map((t) => t.pillar) ?? [])];

  const content = () => {
    if (selectedThread && threadDetail) {
      return (
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          <button
            onClick={() => setSelectedThread(null)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <BiSolidLeftArrow className="w-4 h-4" />
            Back to My Feedback
          </button>

          <div className="space-y-4 mb-6">
            <DimensionBadge dimension={threadDetail.thread.pillar} />
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

          <div className="space-y-4 mb-8">
            {threadDetail.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.authorRole === "anonymous_member" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-4 space-y-2",
                    msg.authorRole === "anonymous_member"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border-2 border-border"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.authorRole === "lead" ? (
                      <BiSolidShield className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <BiSolidUser className="w-3.5 h-3.5" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      msg.authorRole === "anonymous_member" ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {msg.authorRole === "lead" ? "Team Lead" : "You"}
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
                                  msg.authorRole === "anonymous_member"
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
                              msg.authorRole === "anonymous_member" ? "text-primary-foreground" : "text-foreground"
                            )}>
                              <span className={cn(
                                "text-xs font-medium",
                                msg.authorRole === "anonymous_member" ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>Other: </span>
                              {parsed.other}
                            </p>
                          )}
                          {parsed.comment && (
                            <p className={cn(
                              "text-sm leading-relaxed italic",
                              msg.authorRole === "anonymous_member" ? "text-primary-foreground/90" : "text-muted-foreground"
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
                        msg.authorRole === "anonymous_member" ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {msg.content}
                      </p>
                    );
                  })()}
                  <p className={cn(
                    "text-[10px]",
                    msg.authorRole === "anonymous_member" ? "text-primary-foreground/60" : "text-muted-foreground"
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
                  placeholder="Continue the conversation anonymously..."
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
                Your identity stays anonymous — the lead only sees your messages, not who you are
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
            My Feedback
          </h1>
          <p className="text-muted-foreground">
            Your anonymous check-in feedback and lead responses. Your identity is never revealed.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !threads || threads.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-secondary rounded-2xl mx-auto flex items-center justify-center mb-4">
                <BiSolidInbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No feedback yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                When you share qualitative feedback during pulse checks, your anonymous threads will appear here — along with any responses from your lead.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pillarsWithThreads.length > 1 && (
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
                  All ({threads.length})
                </button>
                {pillarsWithThreads.map((p) => (
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
                    {getPillarLabel(p)} ({threads.filter((t) => t.pillar === p).length})
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {filteredThreads.map((thread) => (
                <Card
                  key={thread.id}
                  className="cursor-pointer hover:border-primary/40 transition-all duration-200 group"
                  onClick={() => setSelectedThread(thread.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <DimensionBadge dimension={thread.pillar} />
                          <StatusBadge status={thread.status} />
                          {thread.hasLeadReply && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 flex items-center gap-1">
                              <BiSolidShield className="w-2.5 h-2.5" />
                              Lead replied
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-foreground leading-snug">
                          {thread.topic}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BiSolidMessageRounded className="w-3.5 h-3.5" />
                            {thread.messageCount} {thread.messageCount === 1 ? "message" : "messages"}
                          </span>
                          {thread.lastActivity && (
                            <span className="flex items-center gap-1">
                              <BiSolidTime className="w-3.5 h-3.5" />
                              {formatTime(thread.lastActivity)}
                            </span>
                          )}
                        </div>
                      </div>
                      <BiSolidChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
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
