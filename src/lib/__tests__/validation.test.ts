import { validateConfirmPassword, validateEmail, validateFullName, validatePassword } from "@/lib/validation";

describe("validateEmail", () => {
  it("rejects empty email", () => {
    expect(validateEmail("")).toBe("Email is required.");
  });
  it("rejects invalid email", () => {
    expect(validateEmail("not-an-email")).toBe("Enter a valid email address.");
  });
  it("accepts valid email", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("rejects empty", () => {
    expect(validatePassword("").valid).toBe(false);
  });
  it("rejects short passwords", () => {
    const result = validatePassword("short");
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/at least 8/);
  });
  it("scores stronger passwords higher", () => {
    const weak = validatePassword("abcdefgh");
    const strong = validatePassword("Abcdef12!xyz");
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.valid).toBe(true);
  });
});

describe("validateFullName", () => {
  it("requires a name", () => {
    expect(validateFullName("  ")).toBe("Full name is required.");
  });
  it("accepts a normal name", () => {
    expect(validateFullName("Ada Lovelace")).toBeNull();
  });
});

describe("validateConfirmPassword", () => {
  it("detects mismatch", () => {
    expect(validateConfirmPassword("password123", "password124")).toBe("Passwords do not match.");
  });
  it("accepts match", () => {
    expect(validateConfirmPassword("password123", "password123")).toBeNull();
  });
});
