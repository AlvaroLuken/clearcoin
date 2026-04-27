import { describe, expect, it } from "vitest";
import { recommendProvider } from "./providers";

describe("recommendProvider", () => {
  it("chooses Plaid first for Chase + Apple Card coverage with a fast MVP path", () => {
    const recommendation = recommendProvider(["chase", "apple-card", "robinhood"]);

    expect(recommendation.primary.id).toBe("plaid");
    expect(recommendation.primary.strengths).toContain("broad Chase support");
    expect(recommendation.fallbacks.map((provider) => provider.id)).toContain("teller");
    expect(recommendation.notes.join(" ").toLowerCase()).toContain("apple card");
  });
});
