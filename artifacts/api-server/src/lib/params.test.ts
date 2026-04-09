import { describe, it, expect } from "vitest";
import { type Request } from "express";
import { intParam, intQuery, stringQuery } from "./params";

function fakeReq(params: Record<string, unknown> = {}, query: Record<string, unknown> = {}): Request {
  return { params, query } as unknown as Request;
}

describe("intParam", () => {
  it("returns the parsed integer for a well-formed param", () => {
    expect(intParam(fakeReq({ id: "42" }), "id")).toBe(42);
  });

  it("returns null for a missing param", () => {
    expect(intParam(fakeReq({}), "id")).toBeNull();
  });

  it("returns null for a non-numeric value", () => {
    expect(intParam(fakeReq({ id: "abc" }), "id")).toBeNull();
  });

  it("returns null for a floating-point value", () => {
    expect(intParam(fakeReq({ id: "3.14" }), "id")).toBeNull();
  });

  it("uses the first entry of an array value", () => {
    expect(intParam(fakeReq({ id: ["7", "8"] }), "id")).toBe(7);
  });

  it("returns null for an array with a non-numeric first entry", () => {
    expect(intParam(fakeReq({ id: ["abc"] }), "id")).toBeNull();
  });

  it("returns null when the raw value is not a string", () => {
    expect(intParam(fakeReq({ id: 42 as unknown as string }), "id")).toBeNull();
  });
});

describe("intQuery", () => {
  it("parses a query string integer", () => {
    expect(intQuery(fakeReq({}, { days: "90" }), "days")).toBe(90);
  });

  it("returns null for a missing query", () => {
    expect(intQuery(fakeReq({}, {}), "days")).toBeNull();
  });

  it("returns null for a non-numeric query", () => {
    expect(intQuery(fakeReq({}, { days: "forever" }), "days")).toBeNull();
  });
});

describe("stringQuery", () => {
  it("returns a trimmed non-empty string", () => {
    expect(stringQuery(fakeReq({}, { q: "  hi  " }), "q")).toBe("hi");
  });

  it("returns null for whitespace-only values", () => {
    expect(stringQuery(fakeReq({}, { q: "   " }), "q")).toBeNull();
  });

  it("returns null when the query is missing", () => {
    expect(stringQuery(fakeReq({}, {}), "q")).toBeNull();
  });
});
