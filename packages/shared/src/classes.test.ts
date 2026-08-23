import { describe, expect, it } from "vitest";
import { CreateClassSchema, JoinClassSchema, PresignFileSchema } from "./classes";

describe("CreateClassSchema", () => {
  it("valida clase", () => {
    const data = CreateClassSchema.parse({
      name: "Matemáticas 2A",
      cycleId: "11111111-1111-4111-8111-111111111111",
      section: "2A",
    });
    expect(data.name).toContain("Matemáticas");
  });
});

describe("JoinClassSchema", () => {
  it("exige joinCode", () => {
    expect(() => JoinClassSchema.parse({ joinCode: "AB" })).toThrow();
    expect(JoinClassSchema.parse({ joinCode: "ABC123" }).joinCode).toBe("ABC123");
  });
});

describe("PresignFileSchema", () => {
  it("limita tamaño", () => {
    expect(() =>
      PresignFileSchema.parse({
        originalName: "a.pdf",
        mimeType: "application/pdf",
        size: 50 * 1024 * 1024,
      }),
    ).toThrow();
  });
});
