import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  oneOnOneNotesTable,
  oneOnOneActionItemsTable,
  oneOnOneRemindersTable,
  type OneOnOneActionItem,
} from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { requireLeadOrDirector } from "../middlewares/requireAuth";

interface ActionItemInput {
  text: string;
  isCompleted?: boolean;
}

const router: IRouter = Router();
const leadOrDirector = requireLeadOrDirector;

const DEFAULT_INTERVAL_WEEKS = 4;

function computeDefaultNextDate(lastMeetingDate: string | null): string | null {
  if (!lastMeetingDate) return null;
  const last = new Date(lastMeetingDate);
  last.setDate(last.getDate() + DEFAULT_INTERVAL_WEEKS * 7);
  return last.toISOString().split("T")[0];
}

function resolveNextDate(
  explicitNextDate: string | null | undefined,
  lastMeetingDate: string | null
): string | null {
  if (explicitNextDate) return explicitNextDate;
  return computeDefaultNextDate(lastMeetingDate);
}

function computeReminderStatus(
  nextDate: string | null
): "on_track" | "nudge_due" | "overdue" | "off" {
  if (!nextDate) return "on_track";

  const next = new Date(nextDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffMs = next.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "nudge_due";
  return "on_track";
}

router.get("/one-on-ones/members", leadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;
  if (!user.teamId) {
    res.json([]);
    return;
  }

  const members = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.teamId, user.teamId));

  const teamMemberIds = members.filter((m) => m.id !== user.id).map((m) => m.id);

  const notes = await db
    .select({
      memberUserId: oneOnOneNotesTable.memberUserId,
      meetingDate: oneOnOneNotesTable.meetingDate,
    })
    .from(oneOnOneNotesTable)
    .where(
      and(
        eq(oneOnOneNotesTable.teamId, user.teamId),
        eq(oneOnOneNotesTable.leadUserId, user.id)
      )
    )
    .orderBy(desc(oneOnOneNotesTable.meetingDate));

  const lastDateByMember = new Map<number, string>();
  const noteCountByMember = new Map<number, number>();
  for (const note of notes) {
    if (!lastDateByMember.has(note.memberUserId)) {
      lastDateByMember.set(note.memberUserId, note.meetingDate);
    }
    noteCountByMember.set(note.memberUserId, (noteCountByMember.get(note.memberUserId) ?? 0) + 1);
  }

  const reminders = await db
    .select()
    .from(oneOnOneRemindersTable)
    .where(
      and(
        eq(oneOnOneRemindersTable.teamId, user.teamId),
        eq(oneOnOneRemindersTable.leadUserId, user.id)
      )
    );
  const reminderByMember = new Map(reminders.map((r) => [r.memberUserId, r]));

  const result = teamMemberIds.map((id) => {
    const lastDate = lastDateByMember.get(id) ?? null;
    const reminder = reminderByMember.get(id);
    const nextDate = resolveNextDate(reminder?.nextDate, lastDate);

    return {
      id,
      lastOneOnOneDate: lastDate,
      intervalWeeks: reminder?.intervalWeeks ?? DEFAULT_INTERVAL_WEEKS,
      reminderStatus: computeReminderStatus(nextDate),
      nextDate,
      noteCount: noteCountByMember.get(id) ?? 0,
    };
  });

  res.json(result);
});

router.get("/one-on-ones/members/:memberId", leadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;
  const memberId = parseInt(req.params.memberId);
  if (isNaN(memberId)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const notes = await db
    .select()
    .from(oneOnOneNotesTable)
    .where(
      and(
        eq(oneOnOneNotesTable.teamId, user.teamId!),
        eq(oneOnOneNotesTable.leadUserId, user.id),
        eq(oneOnOneNotesTable.memberUserId, memberId)
      )
    )
    .orderBy(desc(oneOnOneNotesTable.meetingDate));

  const noteIds = notes.map((n) => n.id);
  let actionItems: OneOnOneActionItem[] = [];
  if (noteIds.length > 0) {
    actionItems = await db
      .select()
      .from(oneOnOneActionItemsTable)
      .where(inArray(oneOnOneActionItemsTable.noteId, noteIds));
  }

  const actionItemsByNote = new Map<number, OneOnOneActionItem[]>();
  for (const item of actionItems) {
    if (!actionItemsByNote.has(item.noteId)) {
      actionItemsByNote.set(item.noteId, []);
    }
    actionItemsByNote.get(item.noteId)!.push(item);
  }

  const result = notes.map((n) => ({
    ...n,
    actionItems: (actionItemsByNote.get(n.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  res.json(result);
});

router.post("/one-on-ones/notes", leadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;
  const { memberUserId, meetingDate, checkIn, lookingBack, lookingForward, additionalNotes, actionItems } = req.body;

  if (!memberUserId || !meetingDate) {
    res.status(400).json({ error: "memberUserId and meetingDate are required" });
    return;
  }

  const [member] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, memberUserId));
  if (!member || member.teamId !== user.teamId) {
    res.status(400).json({ error: "Member not found or not on your team" });
    return;
  }

  const [note] = await db
    .insert(oneOnOneNotesTable)
    .values({
      teamId: user.teamId!,
      leadUserId: user.id,
      memberUserId,
      meetingDate,
      checkIn: checkIn || null,
      lookingBack: lookingBack || null,
      lookingForward: lookingForward || null,
      additionalNotes: additionalNotes || null,
    })
    .returning();

  let createdItems: OneOnOneActionItem[] = [];
  if (actionItems && Array.isArray(actionItems) && actionItems.length > 0) {
    createdItems = await db
      .insert(oneOnOneActionItemsTable)
      .values(
        (actionItems as ActionItemInput[]).map((item, idx) => ({
          noteId: note.id,
          text: item.text,
          isCompleted: item.isCompleted ?? false,
          sortOrder: idx,
        }))
      )
      .returning();
  }

  const autoNextDate = computeDefaultNextDate(meetingDate);
  if (autoNextDate) {
    const [existingReminder] = await db
      .select()
      .from(oneOnOneRemindersTable)
      .where(
        and(
          eq(oneOnOneRemindersTable.teamId, user.teamId!),
          eq(oneOnOneRemindersTable.leadUserId, user.id),
          eq(oneOnOneRemindersTable.memberUserId, memberUserId)
        )
      );

    if (existingReminder) {
      await db
        .update(oneOnOneRemindersTable)
        .set({ nextDate: autoNextDate, updatedAt: new Date() })
        .where(eq(oneOnOneRemindersTable.id, existingReminder.id));
    } else {
      await db.insert(oneOnOneRemindersTable).values({
        teamId: user.teamId!,
        leadUserId: user.id,
        memberUserId: memberUserId,
        nextDate: autoNextDate,
      });
    }
  }

  res.status(201).json({ ...note, actionItems: createdItems });
});

router.put("/one-on-ones/notes/:noteId", leadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;
  const noteId = parseInt(req.params.noteId);
  if (isNaN(noteId)) {
    res.status(400).json({ error: "Invalid note ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(oneOnOneNotesTable)
    .where(eq(oneOnOneNotesTable.id, noteId));

  if (!existing || existing.leadUserId !== user.id || existing.teamId !== user.teamId) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const { meetingDate, checkIn, lookingBack, lookingForward, additionalNotes, actionItems } = req.body;

  const [updated] = await db
    .update(oneOnOneNotesTable)
    .set({
      meetingDate: meetingDate ?? existing.meetingDate,
      checkIn: checkIn !== undefined ? (checkIn || null) : existing.checkIn,
      lookingBack: lookingBack !== undefined ? (lookingBack || null) : existing.lookingBack,
      lookingForward: lookingForward !== undefined ? (lookingForward || null) : existing.lookingForward,
      additionalNotes: additionalNotes !== undefined ? (additionalNotes || null) : existing.additionalNotes,
      updatedAt: new Date(),
    })
    .where(eq(oneOnOneNotesTable.id, noteId))
    .returning();

  if (actionItems && Array.isArray(actionItems)) {
    await db.delete(oneOnOneActionItemsTable).where(eq(oneOnOneActionItemsTable.noteId, noteId));
    if (actionItems.length > 0) {
      await db.insert(oneOnOneActionItemsTable).values(
        (actionItems as ActionItemInput[]).map((item, idx) => ({
          noteId: noteId,
          text: item.text,
          isCompleted: item.isCompleted ?? false,
          sortOrder: idx,
        }))
      );
    }
  }

  const updatedItems = await db
    .select()
    .from(oneOnOneActionItemsTable)
    .where(eq(oneOnOneActionItemsTable.noteId, noteId));

  res.json({ ...updated, actionItems: updatedItems.sort((a, b) => a.sortOrder - b.sortOrder) });
});

router.delete("/one-on-ones/notes/:noteId", leadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;
  const noteId = parseInt(req.params.noteId);
  if (isNaN(noteId)) {
    res.status(400).json({ error: "Invalid note ID" });
    return;
  }

  const [existing] = await db
    .select()
    .from(oneOnOneNotesTable)
    .where(eq(oneOnOneNotesTable.id, noteId));

  if (!existing || existing.leadUserId !== user.id || existing.teamId !== user.teamId) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  await db.delete(oneOnOneNotesTable).where(eq(oneOnOneNotesTable.id, noteId));
  res.json({ success: true });
});

router.put("/one-on-ones/members/:memberId/reminder", leadOrDirector, async (req, res): Promise<void> => {
  const user = req.user!;
  const memberId = parseInt(req.params.memberId);
  if (isNaN(memberId)) {
    res.status(400).json({ error: "Invalid member ID" });
    return;
  }

  const { nextDate } = req.body;
  if (!nextDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) {
    res.status(400).json({ error: "nextDate is required (YYYY-MM-DD)" });
    return;
  }

  const [memberCheck] = await db
    .select({ id: usersTable.id, teamId: usersTable.teamId })
    .from(usersTable)
    .where(eq(usersTable.id, memberId));
  if (!memberCheck || memberCheck.teamId !== user.teamId) {
    res.status(404).json({ error: "Member not found or not on your team" });
    return;
  }

  const [existing] = await db
    .select()
    .from(oneOnOneRemindersTable)
    .where(
      and(
        eq(oneOnOneRemindersTable.teamId, user.teamId!),
        eq(oneOnOneRemindersTable.leadUserId, user.id),
        eq(oneOnOneRemindersTable.memberUserId, memberId)
      )
    );

  if (existing) {
    const [updated] = await db
      .update(oneOnOneRemindersTable)
      .set({ nextDate, updatedAt: new Date() })
      .where(eq(oneOnOneRemindersTable.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(oneOnOneRemindersTable)
      .values({
        teamId: user.teamId!,
        leadUserId: user.id,
        memberUserId: memberId,
        nextDate,
      })
      .returning();
    res.json(created);
  }
});

export default router;
