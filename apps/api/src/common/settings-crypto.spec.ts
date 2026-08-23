import { decryptSecret, encryptSecret } from "./settings-crypto";

describe("settings-crypto", () => {
  const prev = process.env.SETTINGS_ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.SETTINGS_ENCRYPTION_KEY = "test-settings-key-for-unit-tests";
  });

  afterAll(() => {
    if (prev === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY;
    else process.env.SETTINGS_ENCRYPTION_KEY = prev;
  });

  it("round-trips a secret", () => {
    const cipher = encryptSecret("smtp-password-123");
    expect(cipher).toContain(":");
    expect(decryptSecret(cipher)).toBe("smtp-password-123");
  });
});
