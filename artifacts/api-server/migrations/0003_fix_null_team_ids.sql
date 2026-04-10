-- One-time fix: assign team_id to pre-seeded users who accepted invitations
-- but never got their team_id set due to a bug in the old upsertUser logic.
-- Ksenia (id=2) and Valeria (id=3) have team_id=NULL despite having accepted
-- invitations to team 1. This sets their team_id to match the invitation.
UPDATE users SET team_id = 1 WHERE id IN (2, 3) AND team_id IS NULL;
