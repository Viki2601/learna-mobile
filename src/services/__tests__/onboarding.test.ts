import { nextOnboardingStep } from "@/services/profileService";
import { UserProfile } from "@/types";

const baseProfile: UserProfile = {
  id: "u1",
  full_name: "Ada",
  email: "ada@example.com",
  auth_provider: "email",
  phone_number: null,
  github_url: null,
  portfolio_url: null,
  avatar_path: null,
  deactivated_at: null,
  professional_status: null,
  career_goal: null,
  technologies: [],
  onboarding_complete: false,
  created_at: "",
  updated_at: "",
};

describe("nextOnboardingStep", () => {
  it("starts at status when profile is missing", () => {
    expect(nextOnboardingStep(null)).toBe("status");
  });
  it("requires status first", () => {
    expect(nextOnboardingStep(baseProfile)).toBe("status");
  });
  it("moves to goals after status", () => {
    expect(nextOnboardingStep({ ...baseProfile, professional_status: "student" })).toBe("goals");
  });
  it("moves to technologies after goals", () => {
    expect(
      nextOnboardingStep({ ...baseProfile, professional_status: "student", career_goal: "job_search" })
    ).toBe("technologies");
  });
  it("is done when onboarding is complete", () => {
    expect(
      nextOnboardingStep({
        ...baseProfile,
        professional_status: "employed",
        career_goal: "skill_improvement",
        technologies: ["React"],
        onboarding_complete: true,
      })
    ).toBe("done");
  });
});
