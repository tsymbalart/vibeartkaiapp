import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SheetTitle } from "@/components/ui/sheet";
import { ScoreSelector, RiskLevelBadge, OppLevelBadge } from "@/components/design-ops/ScoreSelector";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  BiSolidFolder,
  BiSolidUser,
  BiX,
  BiArchive,
  BiTrash,
  BiSolidCalendar,
} from "react-icons/bi";
import { format } from "date-fns";
import { computeRiskScore, computeOpportunityScore } from "@workspace/scoring";
import type { KanbanItem } from "@/components/design-ops/ItemCard";

interface ItemDetailPanelProps {
  item: KanbanItem;
  onClose: () => void;
}

interface DesignTeamMemberLite {
  id: number;
  name: string;
}

export function ItemDetailPanel({ item, onClose }: ItemDetailPanelProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const isRisk = item.itemType === "risk";
  const typeLabel = isRisk ? "Risk" : "Opportunity";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery<DesignTeamMemberLite[]>({
    queryKey: ["/api/design-team"],
    queryFn: () => apiFetch<DesignTeamMemberLite[]>("/api/design-team"),
  });

  const [editForm, setEditForm] = useState({
    title: item.title,
    description: item.description || "",
    dueDate: item.dueDate || "",
    responsibleUserId: item.responsibleUserId ? String(item.responsibleUserId) : "",
    impact: item.impact || 2,
    probability: item.probability || 2,
    confidence: item.confidence || 2,
    value: item.value || 2,
    priority: item.priority ?? 0,
  });

  const scoreInfo = isRisk
    ? computeRiskScore(editForm.probability, editForm.impact)
    : computeOpportunityScore(editForm.confidence, editForm.value);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/register-items/${item.id}`);
    },
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      toast({ title: `${typeLabel} deleted` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/register-items/${item.id}`, { status: "done" });
    },
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      toast({ title: `${typeLabel} archived` });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to archive", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const base = {
        title: editForm.title,
        description: editForm.description || "",
        dueDate: editForm.dueDate || null,
        responsibleUserId: editForm.responsibleUserId ? Number(editForm.responsibleUserId) : null,
        priority: editForm.priority,
      };
      const payload = isRisk
        ? { ...base, impact: editForm.impact, probability: editForm.probability }
        : { ...base, confidence: editForm.confidence, value: editForm.value };
      await apiRequest("PATCH", `/api/register-items/${item.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/design-ops/dashboard"] });
      toast({ title: `${typeLabel} updated` });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col h-full">
      <SheetTitle className="sr-only">Edit {typeLabel}</SheetTitle>
      <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${isRisk ? "bg-red-500" : "bg-emerald-500"}`} />
          <h2 className="text-[15px] font-medium text-foreground">Edit {typeLabel}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          data-testid="button-close-task-detail"
        >
          <BiX className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Linked To</span>
          <Link
            href={item.sourceLink}
            className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border hover:border-muted-foreground/30 transition-colors"
            data-testid="link-detail-source"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-secondary text-foreground">
              {item.source === "project" ? <BiSolidFolder className="w-4 h-4" /> : <BiSolidUser className="w-4 h-4" />}
            </div>
            <span className="text-[14px] font-medium text-foreground">{item.sourceName}</span>
            <span className="text-[11px] text-muted-foreground ml-auto capitalize">
              {item.source === "project" ? "project" : "person"}
            </span>
          </Link>
        </div>

        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            data-testid="input-edit-task-title"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Description..."
            data-testid="input-edit-task-description"
          />
        </div>

        {isRisk ? (
          <>
            <ScoreSelector
              label="Probability"
              value={editForm.probability}
              onChange={(v) => setEditForm({ ...editForm, probability: v })}
              helperText="How likely is this risk to happen?"
              mode="numeric"
            />
            <ScoreSelector
              label="Impact"
              value={editForm.impact}
              onChange={(v) => setEditForm({ ...editForm, impact: v })}
              helperText="How severe would the consequences be?"
              mode="numeric"
            />
          </>
        ) : (
          <>
            <ScoreSelector
              label="Confidence"
              value={editForm.confidence}
              onChange={(v) => setEditForm({ ...editForm, confidence: v })}
              helperText="How likely is this opportunity to be realized?"
              mode="numeric"
            />
            <ScoreSelector
              label="Value"
              value={editForm.value}
              onChange={(v) => setEditForm({ ...editForm, value: v })}
              helperText="How significant would the benefit be?"
              mode="numeric"
            />
          </>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{isRisk ? "Risk" : "Opportunity"} Score:</span>
          {isRisk ? <RiskLevelBadge level={scoreInfo.level} /> : <OppLevelBadge level={scoreInfo.level} />}
        </div>

        <div className="space-y-2">
          <Label>Due Date</Label>
          <div className="relative">
            <BiSolidCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={editForm.dueDate}
              onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
              data-testid="input-edit-task-due-date"
              className="pl-9 [&::-webkit-calendar-picker-indicator]:hidden"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Responsible</Label>
          <Select
            value={editForm.responsibleUserId || undefined}
            onValueChange={(v) => setEditForm({ ...editForm, responsibleUserId: v })}
          >
            <SelectTrigger data-testid="select-edit-task-responsible">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {(usersData || []).map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={String(editForm.priority)}
            onValueChange={(v) => setEditForm({ ...editForm, priority: Number(v) })}
          >
            <SelectTrigger data-testid="select-edit-task-priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Normal (0)</SelectItem>
              <SelectItem value="1">Low (1)</SelectItem>
              <SelectItem value="2">Medium (2)</SelectItem>
              <SelectItem value="3">High (3)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {item.createdAt && (
          <div className="pt-2 border-t border-border">
            <span className="text-[13px] text-muted-foreground">
              Created {format(new Date(item.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-border flex gap-2">
          <Button
            className="flex-1"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || !editForm.title}
            data-testid="button-save-task-edit"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1">
                More options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full">
              <DropdownMenuItem
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
                data-testid={`button-archive-item-${item.id}`}
              >
                <BiArchive className="w-3.5 h-3.5 mr-2" />
                {archiveMutation.isPending ? "Archiving..." : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
                data-testid={`button-delete-item-${item.id}`}
              >
                <BiTrash className="w-3.5 h-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {typeLabel}</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{item.title}&quot;? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
