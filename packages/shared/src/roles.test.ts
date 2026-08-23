import { describe, expect, it } from "vitest";
import { LoginSchema, RegisterSchema, RoleSchema } from "./roles";

describe("RoleSchema", () => {
  it("acepta roles válidos", () => {
    expect(RoleSchema.parse("STUDENT")).toBe("STUDENT");
    expect(RoleSchema.parse("TEACHER")).toBe("TEACHER");
  });

  it("rechaza roles inválidos", () => {
    expect(() => RoleSchema.parse("GUEST")).toThrow();
  });
});

describe("RegisterSchema", () => {
  it("valida registro correcto", () => {
    const data = RegisterSchema.parse({
      email: "alumno@school.test",
      password: "secreto12",
      fullName: "Ana Pérez",
      role: "STUDENT",
    });
    expect(data.role).toBe("STUDENT");
  });

  it("no permite registrar ADMIN", () => {
    expect(() =>
      RegisterSchema.parse({
        email: "admin@school.test",
        password: "secreto12",
        fullName: "Admin",
        role: "ADMIN",
      }),
    ).toThrow();
  });

  it("exige password mínimo 8", () => {
    expect(() =>
      RegisterSchema.parse({
        email: "a@b.com",
        password: "corta",
        fullName: "Ana",
        role: "STUDENT",
      }),
    ).toThrow();
  });
});

describe("LoginSchema", () => {
  it("valida login", () => {
    expect(
      LoginSchema.parse({ email: "a@b.com", password: "x" }).email,
    ).toBe("a@b.com");
  });
});
