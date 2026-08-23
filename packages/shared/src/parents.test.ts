import { describe, expect, it } from "vitest";
import { InviteUserSchema, ParentLinkRequestSchema } from "./parents";

describe("parents schemas", () => {
  it("valida solicitud de vínculo", () => {
    const parsed = ParentLinkRequestSchema.parse({
      studentEmail: "alumno@escuela.mx",
    });
    expect(parsed.studentEmail).toBe("alumno@escuela.mx");
  });

  it("valida invitación admin", () => {
    const parsed = InviteUserSchema.parse({
      email: "t@escuela.mx",
      fullName: "Prof",
      role: "TEACHER",
      password: "12345678",
    });
    expect(parsed.role).toBe("TEACHER");
  });
});
