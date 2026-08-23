import { describe, expect, it } from "vitest";
import { API_URL } from "./index";

describe("api-client", () => {
  it("expone API_URL por defecto", () => {
    expect(API_URL).toContain("/api/v1");
  });
});
