import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, invitationsTable, teamsTable, allowedEmailsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

const router: IRouter = Router();

function getOrigin(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setTempCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: OIDC_COOKIE_TTL,
  });
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

async function consumePendingInvitation(email: string): Promise<{ teamId: number | null; role: string } | null> {
  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.email, email),
        eq(invitationsTable.status, "pending")
      )
    );

  if (!invitation) return null;
  if (invitation.expiresAt && new Date(invitation.expiresAt) <= new Date()) return null;

  await db
    .update(invitationsTable)
    .set({ status: "accepted" })
    .where(eq(invitationsTable.id, invitation.id));

  return { teamId: invitation.teamId, role: invitation.role };
}

async function lookupAllowedEmail(email: string): Promise<{ teamId: number | null } | null> {
  const [row] = await db
    .select()
    .from(allowedEmailsTable)
    .where(eq(allowedEmailsTable.email, email));
  if (!row) return null;
  return { teamId: row.teamId };
}

async function upsertUser(claims: { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string }): Promise<typeof usersTable.$inferSelect> {
  const googleId = claims.sub;
  const emailVerified = claims.email_verified === true;
  const email = emailVerified ? (claims.email || null) : null;
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

    if (!existingByGoogleId.teamId && email) {
      const inv = await consumePendingInvitation(email);
      if (inv) {
        updates.teamId = inv.teamId;
        updates.role = inv.role;
      } else {
        const allowed = await lookupAllowedEmail(email);
        if (allowed?.teamId) updates.teamId = allowed.teamId;
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

      if (!existingByEmail.teamId) {
        const inv = await consumePendingInvitation(email);
        if (inv) {
          updates.teamId = inv.teamId;
          updates.role = inv.role;
        } else {
          const allowed = await lookupAllowedEmail(email);
          if (allowed?.teamId) updates.teamId = allowed.teamId;
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

  let teamId: number | null = null;
  let role = "member";

  if (email) {
    const inv = await consumePendingInvitation(email);
    if (inv) {
      teamId = inv.teamId;
      role = inv.role;
    } else {
      const allowed = await lookupAllowedEmail(email);
      if (allowed?.teamId) {
        teamId = allowed.teamId;
      }
    }
  }

  const [newUser] = await db
    .insert(usersTable)
    .values({
      name: displayName,
      email,
      googleId,
      avatarUrl,
      role,
      teamId,
    })
    .returning();

  return newUser;
}

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
    console.error("[auth callback] OAuth error from Google:", error);
    res.redirect("/");
    return;
  }

  if (!code) {
    console.error("[auth callback] No authorization code received");
    res.redirect("/api/login");
    return;
  }

  if (!expectedState || state !== expectedState) {
    console.error("[auth callback] State mismatch", { hasExpectedState: !!expectedState, hasState: !!state });
    res.redirect("/api/login");
    return;
  }

  let tokens;
  try {
    const { tokens: t } = await client.getToken(code);
    tokens = t;
  } catch (err) {
    console.error("[auth callback] Token exchange failed", err);
    res.redirect("/");
    return;
  }

  if (!tokens.id_token) {
    console.error("[auth callback] No id_token in response");
    res.redirect("/");
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
    console.error("[auth callback] ID token verification failed", err);
    res.redirect("/");
    return;
  }

  if (!payload || !payload.sub) {
    console.error("[auth callback] Invalid token payload");
    res.redirect("/");
    return;
  }

  const returnTo = getSafeReturnTo(req.cookies?.return_to);

  res.clearCookie("oauth_state", { path: "/" });
  res.clearCookie("return_to", { path: "/" });

  const dbUser = await upsertUser({
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    picture: payload.picture,
  });

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
