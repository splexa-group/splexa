import { describe, it, expect } from "vitest";

import { didJudgeChange } from "../cases.helper";

const existing = { judgeName: "Justice Rao", judgeDesignation: "District Judge" };

describe("didJudgeChange", () => {
  it("returns false when neither field is in the input", () => {
    expect(didJudgeChange({}, existing)).toBe(false);
  });

  it("returns false when input fields match the existing values", () => {
    expect(
      didJudgeChange(
        { judgeName: "Justice Rao", judgeDesignation: "District Judge" },
        existing,
      ),
    ).toBe(false);
  });

  it("returns true when judgeName differs", () => {
    expect(didJudgeChange({ judgeName: "Justice Iyer" }, existing)).toBe(true);
  });

  it("returns true when judgeDesignation differs", () => {
    expect(
      didJudgeChange({ judgeDesignation: "High Court Judge" }, existing),
    ).toBe(true);
  });

  it("returns false when a field is explicitly undefined (not provided)", () => {
    expect(
      didJudgeChange({ judgeName: undefined, judgeDesignation: undefined }, existing),
    ).toBe(false);
  });
});
