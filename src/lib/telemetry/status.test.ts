import { describe, expect, it } from "vitest";
import { evaluate, freshness, distanceToRange } from "./status";

const now = 1_000_000_000_000;

describe("freshness", () => {
  it("is nodata without timestamp", () => expect(freshness(null, now, 30, 180)).toBe("nodata"));
  it("is stale after stale minutes", () => expect(freshness(now - 31 * 60e3, now, 30, 180)).toBe("stale"));
  it("is offline after offline minutes", () => expect(freshness(now - 181 * 60e3, now, 30, 180)).toBe("offline"));
  it("is live when recent", () => expect(freshness(now - 5 * 60e3, now, 30, 180)).toBe("live"));
});

describe("evaluate", () => {
  it("does not classify without threshold", () => expect(evaluate(10, undefined)).toBe("none"));
  const t = { min: 25, max: 35, warnMargin: 3, source: "demo" as const };
  it("ok inside range", () => expect(evaluate(30, t)).toBe("ok"));
  it("warn just outside", () => expect(evaluate(23, t)).toBe("warn"));
  it("alarm beyond margin", () => expect(evaluate(20, t)).toBe("alarm"));
  it("distance below min", () => expect(distanceToRange(23, t)).toBe(-2));
});
