import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AppLayout } from "@/components/layout/AppLayout";
import { apiFetch, apiUrl, fetchWithAuth } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  BiSolidLeftArrow,
  BiSolidPencil,
  BiSolidTrash,
  BiSolidChevronDown,
  BiSolidChevronUp,
  BiSolidUser,
  BiSolidTime,
  BiPlus,
  BiX,
  BiCheck,
} from "react-icons/bi";

type ActionItem = {
  id?: number;
  text: string;
  isCompleted: boolean;
  sortOrder: number;
};

type Note = {
  id: number;
  meetingDate: string;
  checkIn: string | null;
  lookingBack: string | null;
  lookingForward: string | null;
  additionalNotes: string | null;
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
};

type NoteFormData = {
  meetingDate: string;
  checkIn: string | null;
  lookingBack: string | null;
  lookingForward: string | null;
  additionalNotes: string | null;
  actionItems: { text: string; isCompleted: boolean; sortOrder: number }[];
};

type TeamUser = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  avatarUrl?: string | null;
  subTeamIds: number[];
  teamId: number;
};

type SubTeam = {
  id: number;
  name: string;
  color: string;
  teamId: number;
  memberCount: number;
};


function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return formatDate(dateStr);
}

function NoteForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Note>;
  onSave: (data: NoteFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [meetingDate, setMeetingDate] = useState(initial?.meetingDate ?? today);
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? "");
  const [lookingBack, setLookingBack] = useState(initial?.lookingBack ?? "");
  const [lookingForward, setLookingForward] = useState(initial?.lookingForward ?? "");
  const [actionItems, setActionItems] = useState<ActionItem[]>(
    initial?.actionItems ?? []
  );
  const [newItemText, setNewItemText] = useState("");

  function addItem() {
    if (!newItemText.trim()) return;
    setActionItems([...actionItems, { text: newItemText.trim(), isCompleted: false, sortOrder: actionItems.length }]);
    setNewItemText("");
  }

  function removeItem(idx: number) {
    setActionItems(actionItems.filter((_, i) => i !== idx));
  }

  function toggleItem(idx: number) {
    setActionItems(actionItems.map((item, i) => i === idx ? { ...item, isCompleted: !item.isCompleted } : item));
  }

  function handleSubmit() {
    onSave({
      meetingDate,
      checkIn: checkIn || null,
      lookingBack: lookingBack || null,
      lookingForward: lookingForward || null,
      additionalNotes: null,
      actionItems: actionItems.map((item, idx) => ({
        text: item.text,
        isCompleted: item.isCompleted,
        sortOrder: idx,
      })),
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-foreground">
        {initial?.id ? "Edit 1:1 Note" : "New 1:1 Note"}
      </h3>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Meeting Date</label>
        <input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="w-1/4 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Check-in</label>
        <Textarea
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          placeholder="How are they feeling, engagement level"
          className="min-h-[60px] resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Looking Back</label>
        <Textarea
          value={lookingBack}
          onChange={(e) => setLookingBack(e.target.value)}
          placeholder="What's going well, project updates, challenges"
          className="min-h-[60px] resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Looking Forward</label>
        <Textarea
          value={lookingForward}
          onChange={(e) => setLookingForward(e.target.value)}
          placeholder="What excites you, goals and actions, exchange feedback and offer support"
          className="min-h-[60px] resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Action Items</label>
        <div className="space-y-2">
          {actionItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Checkbox
                checked={item.isCompleted}
                onCheckedChange={() => toggleItem(idx)}
              />
              <span className={cn("text-sm flex-1", item.isCompleted && "line-through text-muted-foreground")}>
                {item.text}
              </span>
              <button
                onClick={() => removeItem(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <BiX className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
              placeholder="Add action item..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <Button variant="ghost" size="sm" onClick={addItem} className="h-8 w-8 p-0">
              <BiPlus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={saving} className="flex-1">
          {saving ? "Saving..." : initial?.id ? "Update Note" : "Save Note"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function OneOnOneMember() {
  const [, params] = useRoute("/one-on-ones/:memberId");
  const memberId = params?.memberId ? parseInt(params.memberId) : 0;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { toast } = useToast();
  const shouldOpenForm = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("log");
  const [showForm, setShowForm] = useState(shouldOpenForm);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: users = [] } = useQuery<TeamUser[]>({
    queryKey: ["users"],
    queryFn: () => apiFetch<TeamUser[]>("/api/users"),
  });

  const { data: subTeamsList = [] } = useQuery<SubTeam[]>({
    queryKey: ["sub-teams"],
    queryFn: () => apiFetch<SubTeam[]>("/api/sub-teams"),
  });

  const user = users.find((u) => u.id === memberId);
  const subTeamMap = new Map(subTeamsList.map((st) => [st.id, st]));
  const memberSubTeams = user?.subTeamIds.map((id) => subTeamMap.get(id)).filter((st): st is SubTeam => Boolean(st)) ?? [];

  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ["one-on-one-notes", memberId],
    queryFn: () => apiFetch<Note[]>(`/api/one-on-ones/members/${memberId}`),
    enabled: memberId > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      const resp = await fetchWithAuth(apiUrl("/api/one-on-ones/notes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, memberUserId: memberId }),
      });
      if (!resp.ok) throw new Error("Failed to create note");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["one-on-one-notes", memberId] });
      queryClient.invalidateQueries({ queryKey: ["one-on-one-members"] });
      setShowForm(false);
      toast({ title: "1:1 note saved" });
    },
    onError: () => {
      toast({ title: "Failed to save note", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ noteId, data }: { noteId: number; data: NoteFormData }) => {
      const resp = await fetchWithAuth(apiUrl(`/api/one-on-ones/notes/${noteId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error("Failed to update note");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["one-on-one-notes", memberId] });
      queryClient.invalidateQueries({ queryKey: ["one-on-one-members"] });
      setEditingNote(null);
      toast({ title: "1:1 note updated" });
    },
    onError: () => {
      toast({ title: "Failed to update note", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const resp = await fetchWithAuth(apiUrl(`/api/one-on-ones/notes/${noteId}`), {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error("Failed to delete note");
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["one-on-one-notes", memberId] });
      queryClient.invalidateQueries({ queryKey: ["one-on-one-members"] });
      setConfirmDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  const handleDelete = useCallback((noteId: number) => {
    setPendingDeleteId(noteId);
    setConfirmDeleteId(null);

    const { dismiss } = toast({
      title: "Note deleted",
      duration: 5000,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          if (deleteTimerRef.current) {
            clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
          }
          setPendingDeleteId(null);
          dismiss();
        }}>
          Undo
        </ToastAction>
      ),
    });

    deleteTimerRef.current = setTimeout(() => {
      deleteTimerRef.current = null;
      setPendingDeleteId(null);
      deleteMutation.mutate(noteId);
    }, 5000);
  }, [deleteMutation, toast]);

  function toggleExpanded(noteId: number) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  }

  function getPreviewText(note: Note): string {
    const parts = [note.checkIn, note.lookingBack, note.lookingForward].filter(Boolean);
    const full = parts.join(" · ");
    return full.length > 120 ? full.slice(0, 120) + "..." : full || "No notes";
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <button
          onClick={() => navigate("/one-on-ones")}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <BiSolidLeftArrow className="w-4 h-4" />
          Back to 1:1s
        </button>

        <div className="flex items-center gap-3 mb-6">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center flex-shrink-0 text-base font-medium text-violet-600 dark:text-violet-400">
              {(user?.name ?? "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium text-foreground leading-tight">
              {user?.name ?? "Team Member"}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-muted-foreground">
              <span className="capitalize">{user?.role ?? ""}</span>
              <span>·</span>
              <span>{notes.length} {notes.length === 1 ? "note" : "notes"}</span>
              {notes.length > 0 && (
                <>
                  <span>·</span>
                  <span>Last: {formatDate(notes[0]?.meetingDate)}</span>
                </>
              )}
            </div>
          </div>
          {!showForm && !editingNote && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 rounded-xl gap-1.5 text-xs"
              onClick={() => setShowForm(true)}
            >
              <BiPlus className="w-3.5 h-3.5" />
              Log new 1:1
            </Button>
          )}
        </div>

        <div className="space-y-6">
            {editingNote ? (
              <Card>
                <CardContent className="p-5">
                  <NoteForm
                    initial={editingNote}
                    onSave={(data) => updateMutation.mutate({ noteId: editingNote.id, data })}
                    onCancel={() => setEditingNote(null)}
                    saving={updateMutation.isPending}
                  />
                </CardContent>
              </Card>
            ) : showForm ? (
              <Card>
                <CardContent className="p-5">
                  <NoteForm
                    onSave={(data) => createMutation.mutate(data)}
                    onCancel={() => setShowForm(false)}
                    saving={createMutation.isPending}
                  />
                </CardContent>
              </Card>
            ) : null}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No 1:1 notes yet. Click "Log new 1:1" to record your first meeting.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Previous 1:1s
                </h2>
                <div className="space-y-3">

                {notes.filter((n) => n.id !== pendingDeleteId).map((note) => {
                  const isExpanded = expandedNotes.has(note.id);
                  const completedItems = note.actionItems.filter((i) => i.isCompleted).length;
                  const totalItems = note.actionItems.length;

                  return (
                    <div
                      key={note.id}
                      className="rounded-2xl border-2 border-border bg-card"
                    >
                      <div
                        className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-colors rounded-2xl"
                        onClick={() => toggleExpanded(note.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              {formatDate(note.meetingDate)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeDate(note.meetingDate)}
                            </span>
                            {totalItems > 0 && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium border bg-secondary text-foreground border-border">
                                {completedItems}/{totalItems} items
                              </span>
                            )}
                          </div>
                          {!isExpanded && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {getPreviewText(note)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNote(note);
                              setShowForm(false);
                            }}
                          >
                            <BiSolidPencil className="w-3.5 h-3.5" />
                          </Button>
                          {confirmDeleteId === note.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive"
                                onClick={() => handleDelete(note.id)}
                              >
                                <BiCheck className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                <BiX className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(note.id);
                              }}
                            >
                              <BiSolidTrash className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {isExpanded ? (
                            <BiSolidChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <BiSolidChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border px-5 pb-4 pt-3 space-y-3">
                          {note.checkIn && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Check-in</h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.checkIn}</p>
                            </div>
                          )}
                          {note.lookingBack && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Looking Back</h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.lookingBack}</p>
                            </div>
                          )}
                          {note.lookingForward && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Looking Forward</h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.lookingForward}</p>
                            </div>
                          )}
                          {note.actionItems.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-muted-foreground mb-1">Action Items</h4>
                              <div className="space-y-1">
                                {note.actionItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                                      item.isCompleted
                                        ? "bg-primary border-primary"
                                        : "border-border"
                                    )}>
                                      {item.isCompleted && <BiCheck className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                    <span className={cn(
                                      "text-sm",
                                      item.isCompleted && "line-through text-muted-foreground"
                                    )}>
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
