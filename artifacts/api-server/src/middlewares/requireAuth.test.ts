import { describe, it, expect, vi, beforeEach } from "vitest";
import { type Request, type Response, type NextFunction } from "express";
import {
  requireAuth,
  requireTeam,
  requireRole,
  requireLeadOrDirector,
  requireDirector,
} from "./requireAuth";

type Authed = Partial<Request> & {
  isAuthenticated(): boolean;
  user?: { id: number; name: string; email: string | null; role: string; teamId: number | null; avatarUrl: string | null };
};

function makeReq(user?: Authed["user"]): Request {
  const req: Authed = {
    isAuthenticated() {
      return this.user != null;
    },
    user,
  };
  return req as unknown as Request;
}

function makeRes() {
  const res: Partial<Response> & {
    statusCode?: number;
    body?: unknown;
  } = {};
  res.status = vi.fn(function (this: Response, code: number) {
    res.statusCode = code;
    return this;
  }) as Response["status"];
  res.json = vi.fn(function (this: Response, body: unknown) {
    res.body = body;
    return this;
  }) as Response["json"];
  return res as Response & { statusCode?: number; body?: unknown };
}

describe("requireAuth", () => {
  let next: NextFunction;
  beforeEach(() => {
    next = vi.fn();
  });

  it("401s when there is no user on the request", () => {
    const res = makeRes();
    requireAuth(makeReq(), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when a user is present", () => {
    const res = makeRes();
    requireAuth(
      makeReq({ id: 1, name: "A", email: null, role: "member", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("requireTeam", () => {
  let next: NextFunction;
  beforeEach(() => {
    next = vi.fn();
  });

  it("401s when unauthenticated", () => {
    const res = makeRes();
    requireTeam(makeReq(), res, next);
    expect(res.statusCode).toBe(401);
  });

  it("403s when the user has no teamId", () => {
    const res = makeRes();
    requireTeam(
      makeReq({ id: 1, name: "A", email: null, role: "member", teamId: null, avatarUrl: null }),
      res,
      next,
    );
    expect(res.statusCode).toBe(403);
  });

  it("calls next when the user has a team", () => {
    const res = makeRes();
    requireTeam(
      makeReq({ id: 1, name: "A", email: null, role: "member", teamId: 7, avatarUrl: null }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("requireRole", () => {
  let next: NextFunction;
  beforeEach(() => {
    next = vi.fn();
  });

  it("401s when unauthenticated", () => {
    const res = makeRes();
    requireRole("lead")(makeReq(), res, next);
    expect(res.statusCode).toBe(401);
  });

  it("403s when the user has no team", () => {
    const res = makeRes();
    requireRole("lead")(
      makeReq({ id: 1, name: "A", email: null, role: "lead", teamId: null, avatarUrl: null }),
      res,
      next,
    );
    expect(res.statusCode).toBe(403);
  });

  it("403s when the user's role is not allowed", () => {
    const res = makeRes();
    requireRole("director")(
      makeReq({ id: 1, name: "A", email: null, role: "lead", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the role matches", () => {
    const res = makeRes();
    requireRole("lead", "director")(
      makeReq({ id: 1, name: "A", email: null, role: "lead", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});

describe("requireLeadOrDirector / requireDirector", () => {
  let next: NextFunction;
  beforeEach(() => {
    next = vi.fn();
  });

  it("allows leads through requireLeadOrDirector", () => {
    const res = makeRes();
    requireLeadOrDirector(
      makeReq({ id: 1, name: "A", email: null, role: "lead", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("blocks members from requireLeadOrDirector", () => {
    const res = makeRes();
    requireLeadOrDirector(
      makeReq({ id: 1, name: "A", email: null, role: "member", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(res.statusCode).toBe(403);
  });

  it("blocks leads from requireDirector", () => {
    const res = makeRes();
    requireDirector(
      makeReq({ id: 1, name: "A", email: null, role: "lead", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(res.statusCode).toBe(403);
  });

  it("allows directors through requireDirector", () => {
    const res = makeRes();
    requireDirector(
      makeReq({ id: 1, name: "A", email: null, role: "director", teamId: 1, avatarUrl: null }),
      res,
      next,
    );
    expect(next).toHaveBeenCalledOnce();
  });
});
