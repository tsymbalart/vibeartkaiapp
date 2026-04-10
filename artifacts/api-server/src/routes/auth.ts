import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, invitationsTable, teamsTable, allowedEmailsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import {
  clearSession,
  getOAuth2Client,
  getSessionId,
  createSession,
  deleteSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
  type AppUser,
} from "../lib/auth";

const OIDC_COOKIE_TTL = 10 * 60 * 1000;
// Pending invite token cookie survives the round-trip through Google
// OAuth (up to 15 minutes). It is consumed exactly once in /callback.
const PENDING_INVITE_COOKIE = "pending_invite_token";
const PENDING_INVITE_TTL = 15 * 60 * 1000;

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

// `SameSite=None` is required only when the frontend lives on a
// different site from the API (e.g., claude.ai hosting + separate
// api domain). For same-site deploys prefer `Lax`, which blocks most
// CSRF vectors on state-changing requests.
const CROSS_SITE_COOKIES = process.env.CROSS_SITE_COOKIES === "true";
const COOKIE_SAMESITE: "none" | "lax" = CROSS_SITE_COOKIES ? "none" : "lax";
const COOKIE_SECURE = CROSS_SITE_COOKIES || process.env.NODE_ENV === "production";

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setTempCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
}

function setPendingInviteCookie(res: Response, token: string) {
  res.cookie(PENDING_INVITE_COOKIE, token, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    path: "/",
    maxAge: PENDING_INVITE_TTL,
  });
}

function clearPendingInviteCookie(res: Response) {
  res.clearCookie(PENDING_INVITE_COOKIE, { path: "/" });
}

function getSafeReturnTo(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function toAppUser(user: typeof usersTable.$inferSelect): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    teamId: user.teamId,
    avatarUrl: user.avatarUrl,
  };
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

interface PendingInvite {
  id: number;
  teamId: number | null;
  role: string;
  email: string;
}

/**
 * Look up a pending invitation by its one-time token. Tokens are single
 * use; once accepted we flip status to "accepted" and the row cannot
 * be reused. Expired tokens are ignored.
 */
async function lookupInvitationByToken(token: string): Promise<PendingInvite | null> {
  if (typeof token !== "string" || token.length < 16) return null;
  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.token, token),
        eq(invitationsTable.status, "pending")
      )
    );
  if (!invitation) return null;
  if (invitation.expiresAt && new Date(invitation.expiresAt) <= new Date()) return null;
  return {
    id: invitation.id,
    teamId: invitation.teamId,
    role: invitation.role,
    email: invitation.email,
  };
}

/**
 * Look up a pending invitation for a given email address. Used as the
 * legacy "invite-by-email" path when the signin callback isn't
 * accompanied by a claim token.
 */
async function lookupInvitationByEmail(email: string): Promise<PendingInvite | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.email, normalized),
        eq(invitationsTable.status, "pending")
      )
    );
  if (!invitation) return null;
  if (invitation.expiresAt && new Date(invitation.expiresAt) <= new Date()) return null;
  return {
    id: invitation.id,
    teamId: invitation.teamId,
    role: invitation.role,
    email: invitation.email,
  };
}

async function markInvitationAccepted(id: number): Promise<void> {
  await db
    .update(invitationsTable)
    .set({ status: "accepted" })
    .where(eq(invitationsTable.id, id));
}

async function lookupAllowedEmail(email: string): Promise<{ teamId: number | null } | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const [row] = await db
    .select()
    .from(allowedEmailsTable)
    .where(eq(allowedEmailsTable.email, normalized));
  if (!row) return null;
  return { teamId: row.teamId };
}

/**
 * Resolve which (teamId, role) the sign-in should be admitted to.
 * Precedence:
 *   1. A token-claimed invitation stored in the signed request cookie
 *      (`pending_invite_token`). Strongest: binds the session to the
 *      exact invitation link the user clicked, even if their Google
 *      email differs from what was invited.
 *   2. An invitation pending against the (verified) Google email.
 *   3. A row in `allowed_emails` for the (verified) Google email.
 * Returns null if none apply — the caller should refuse to create a
 * user row.
 */
async function resolveInvite(
  email: string | null,
  pendingToken: string | null,
): Promise<{ teamId: number; role: string; invitationId: number | null } | null> {
  if (pendingToken) {
    const byToken = await lookupInvitationByToken(pendingToken);
    if (byToken?.teamId != null) {
      return {
        teamId: byToken.teamId,
        role: byToken.role,
        invitationId: byToken.id,
      };
    }
  }
  if (email) {
    const byEmail = await lookupInvitationByEmail(email);
    if (byEmail?.teamId != null) {
      return {
        teamId: byEmail.teamId,
        role: byEmail.role,
        invitationId: byEmail.id,
      };
    }
    const allowed = await lookupAllowedEmail(email);
    if (allowed?.teamId != null) {
      return { teamId: allowed.teamId, role: "member", invitationId: null };
    }
  }
  return null;
}

/**
 * Look up an existing user row or create one for a newly signed-in Google
 * account, but ONLY if the account has been authorised (a pending invitation
 * or an entry in `allowed_emails`). Returns `null` for un-authorised
 * sign-ins so the caller can redirect the user to an error screen without
 * creating an orphan `users` row.
 */
async function upsertUser(
  claims: { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string },
  pendingToken: string | null,
): Promise<typeof usersTable.$inferSelect | null> {
  const googleId = claims.sub;
  const emailVerified = claims.email_verified === true;
  const email = emailVerified ? normalizeEmail(claims.email || null) : null;
  const displayName = claims.name || email || "User";
  const avatarUrl = claims.picture || null;

  const [existingByGoogleId] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.googleId, googleId));

  if (existingByGoogleId) {
    const updates: Record<string, unknown> = {
      name: displayName,
      email: email || existingByGoogleId.email,
      avatarUrl: avatarUrl || existingByGoogleId.avatarUrl,
      updatedAt: new Date(),
    };

    // Always check for pending invitations on every sign-in, even if
    // the user already has a teamId. This handles:
    //  - Pre-seeded users with NULL teamId
    //  - Role upgrades (member → lead) via a new invitation
    const resolved = await resolveInvite(email, pendingToken);
    if (resolved) {
      if (!existingByGoogleId.teamId) {
        updates.teamId = resolved.teamId;
      }
      // Apply the invited role if it's an upgrade (or if user has no team yet)
      if (!existingByGoogleId.teamId || resolved.role !== "member") {
        updates.role = resolved.role;
      }
      if (resolved.invitationId != null) {
        await markInvitationAccepted(resolved.invitationId);
      }
    }

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, existingByGoogleId.id))
      .returning();
    return updated;
  }

  if (email) {
    const [existingByEmail] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingByEmail) {
      const updates: Record<string, unknown> = {
        googleId,
        name: displayName,
        avatarUrl: avatarUrl || existingByEmail.avatarUrl,
        updatedAt: new Date(),
      };

      // Always check for pending invitations (same logic as googleId path).
      const resolved = await resolveInvite(email, pendingToken);
      if (resolved) {
        if (!existingByEmail.teamId) {
          updates.teamId = resolved.teamId;
        }
        if (!existingByEmail.teamId || resolved.role !== "member") {
          updates.role = resolved.role;
        }
        if (resolved.invitationId != null) {
          await markInvitationAccepted(resolved.invitationId);
        }
      }

      const [updated] = await db
        .update(usersTable)
        .set(updates)
        .where(eq(usersTable.id, existingByEmail.id))
        .returning();
      return updated;
    }
  }

  // New user: must be invited or on the allowlist. Otherwise do NOT
  // create a row — an un-authorised signup is a silent security hole.
  const resolved = await resolveInvite(email, pendingToken);
  if (!resolved) return null;
  if (!email) {
    // We need *some* email to persist; if the Google account refused
    // to share one and the invite lookup came via token, fall back
    // to the email stored on the invitation row.
    if (resolved.invitationId == null) return null;
    const [invite] = await db
      .select()
      .from(invitationsTable)
      .where(eq(invitationsTable.id, resolved.invitationId));
    if (!invite?.email) return null;
    const [newUser] = await db
      .insert(usersTable)
      .values({
        name: displayName,
        email: invite.email,
        googleId,
        avatarUrl,
        role: resolved.role,
        teamId: resolved.teamId,
      })
      .returning();
    await markInvitationAccepted(resolved.invitationId);
    return newUser;
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({
      name: displayName,
      email,
      googleId,
      avatarUrl,
      role: resolved.role,
      teamId: resolved.teamId,
    })
    .returning();

  if (resolved.invitationId != null) {
    await markInvitationAccepted(resolved.invitationId);
  }

  return newUser;
}

/**
 * Dev-only bypass: creates a session without Google OAuth.
 * Returns JSON so the frontend can call it via fetch() and then
 * re-check /auth/user without a full page navigation (which breaks
 * inside Replit's iframe preview).
 * Disabled in production.
 */
router.post("/dev-login", async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const DEV_EMAIL = "a.tsymbal@artk.ai";
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEV_EMAIL));

  if (!user) {
    res.status(500).json({ error: "Dev user not seeded yet — restart the server." });
    return;
  }

  const sessionData: SessionData = {
    user: toAppUser(user),
    access_token: "dev-token",
  };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({ user: toAppUser(user) });
});

/**
 * Public config the frontend needs to initialise Google Identity Services.
 * The client-id is NOT secret — it's embedded in every page on normal
 * deployments. We surface it here so the Vite build doesn't need to know
 * about it at build time.
 */
router.get("/auth/config", (_req: Request, res: Response) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID ?? null });
});

/**
 * Credential exchange for the Google Identity Services (GIS) one-tap /
 * button flow. The browser sends the signed JWT directly to us; we verify
 * it server-side and create a session — no redirects needed, so this works
 * inside iframes (Replit preview, embedded dashboards, …).
 */
router.post("/auth/google-credential", async (req: Request, res: Response) => {
  const credential = typeof req.body?.credential === "string" ? req.body.credential : null;
  if (!credential) {
    res.status(400).json({ error: "Missing credential" });
    return;
  }

  let sub: string;
  let email: string | undefined;
  let emailVerified: boolean | undefined;
  let name: string | undefined;
  let picture: string | undefined;
  try {
    const client = getOAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    const p = ticket.getPayload()!;
    sub = p.sub;
    email = p.email;
    emailVerified = p.email_verified;
    name = p.name;
    picture = p.picture;
  } catch (err) {
    logger.warn({ err }, "[auth/google-credential] Token verification failed");
    res.status(401).json({ error: "Invalid credential" });
    return;
  }

  if (!sub) {
    res.status(401).json({ error: "Invalid token payload" });
    return;
  }

  const pendingToken =
    typeof req.cookies?.[PENDING_INVITE_COOKIE] === "string"
      ? req.cookies[PENDING_INVITE_COOKIE]
      : null;

  const dbUser = await upsertUser(
    { sub, email, email_verified: emailVerified, name, picture },
    pendingToken,
  );

  if (!dbUser) {
    res.status(403).json({ error: "not_authorized" });
    return;
  }

  clearPendingInviteCookie(res);

  const sessionData: SessionData = {
    user: toAppUser(dbUser),
    access_token: credential,
  };
  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);

  res.json({ user: toAppUser(dbUser) });
});

router.get("/auth/user", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.json({ user: null });
    return;
  }

  const [freshUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));

  if (!freshUser) {
    res.json({ user: null });
    return;
  }

  res.json({ user: toAppUser(freshUser) });
});

/**
 * Entry point for tokenised invitation links. A director creates an
 * invitation via `POST /api/invitations`, copies the resulting claim
 * URL into an email to the invitee, and the invitee follows it here.
 *
 * This endpoint validates the token (ensuring it exists, is pending,
 * and hasn't expired), stores it in a short-lived cookie, then kicks
 * the invitee into the Google sign-in flow. The callback consumes
 * the cookie, binds the new user to the invited team + role, and
 * marks the invitation as accepted.
 *
 * The token itself is NOT rendered into any HTML — it only travels
 * in the URL query string and in the httpOnly cookie.
 */
router.get("/claim-invite", async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : null;
  if (!token) {
    res.redirect("/?auth_error=invalid_invite");
    return;
  }
  const invite = await lookupInvitationByToken(token);
  if (!invite) {
    res.redirect("/?auth_error=invalid_invite");
    return;
  }
  setPendingInviteCookie(res, token);
  // Send the invitee through the normal login flow; the callback
  // will pick up the pending_invite_token cookie and consume it.
  res.redirect(`/api/login?returnTo=${encodeURIComponent("/")}`);
});

router.get("/login", async (req: Request, res: Response) => {
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const client = getOAuth2Client(callbackUrl);

  const returnTo = getSafeReturnTo(req.query.returnTo);
  const state = crypto.randomBytes(32).toString("hex");

  const authorizeUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });

  setTempCookie(res, "oauth_state", state);
  setTempCookie(res, "return_to", returnTo);

  res.redirect(authorizeUrl);
});

router.get("/callback", async (req: Request, res: Response) => {
  const callbackUrl = `${getOrigin(req)}/api/callback`;
  const client = getOAuth2Client(callbackUrl);

  const expectedState = req.cookies?.oauth_state;
  const state = req.query.state as string | undefined;
  const code = req.query.code as string | undefined;
  const error = req.query.error as string | undefined;

  if (error) {
    logger.warn({ error }, "[auth callback] OAuth error from Google");
    res.redirect("/?auth_error=oauth_error");
    return;
  }

  if (!code) {
    logger.warn("[auth callback] No authorization code received");
    res.redirect("/?auth_error=missing_code");
    return;
  }

  if (!expectedState || state !== expectedState) {
    logger.warn(
      { hasExpectedState: !!expectedState, hasState: !!state },
      "[auth callback] State mismatch",
    );
    res.redirect("/?auth_error=state_mismatch");
    return;
  }

  let tokens;
  try {
    const { tokens: t } = await client.getToken(code);
    tokens = t;
  } catch (err) {
    logger.error({ err }, "[auth callback] Token exchange failed");
    res.redirect("/?auth_error=token_exchange_failed");
    return;
  }

  if (!tokens.id_token) {
    logger.error("[auth callback] No id_token in response");
    res.redirect("/?auth_error=no_id_token");
    return;
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });
    payload = ticket.getPayload();
  } catch (err) {
    logger.error({ err }, "[auth callback] ID token verification failed");
    res.redirect("/?auth_error=invalid_id_token");
    return;
  }

  if (!payload || !payload.sub) {
    logger.error("[auth callback] Invalid token payload");
    res.redirect("/?auth_error=invalid_id_token");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);
  const pendingToken =
    typeof req.cookies?.[PENDING_INVITE_COOKIE] === "string"
      ? req.cookies[PENDING_INVITE_COOKIE]
      : null;

  res.clearCookie("oauth_state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });
  clearPendingInviteCookie(res);

  const dbUser = await upsertUser(
    {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    },
    pendingToken,
  );

  if (!dbUser) {
    // Email is not on the allowlist and has no pending invitation.
    // Do NOT create an orphan row. Send the user back to the login
    // screen with an error flag so we can show a helpful message.
    res.redirect("/?auth_error=not_authorized");
    return;
  }

  const sessionData: SessionData = {
    user: toAppUser(dbUser),
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token || undefined,
    expires_at: payload.exp,
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.redirect(returnTo);
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

export default router;
