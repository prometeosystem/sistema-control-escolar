import { describe, expect, it } from "vitest";
import { CreateClassSchema, JoinClassSchema } from "./classes";
import { PresignFileSchema } from "./assignments";
import { MAX_UPLOAD_BYTES, isAllowedFileMime } from "./files";

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
  it("acepta PDF dentro de 10MB", () => {
    const data = PresignFileSchema.parse({
      originalName: "tarea.pdf",
      mimeType: "application/pdf",
      size: 1024,
      purpose: "submission",
    });
    expect(data.mimeType).toBe("application/pdf");
  });

  it("rechaza tamaño > 10MB", () => {
    expect(() =>
      PresignFileSchema.parse({
        originalName: "a.pdf",
        mimeType: "application/pdf",
        size: MAX_UPLOAD_BYTES + 1,
      }),
    ).toThrow();
  });

  it("rechaza mime no permitido", () => {
    expect(() =>
      PresignFileSchema.parse({
        originalName: "a.exe",
        mimeType: "application/x-msdownload",
        size: 100,
      }),
    ).toThrow();
  });
});

describe("isAllowedFileMime", () => {
  it("permite imágenes y docs", () => {
    expect(isAllowedFileMime("image/png")).toBe(true);
    expect(isAllowedFileMime("application/pdf")).toBe(true);
    expect(isAllowedFileMime("text/plain")).toBe(false);
  });
});
