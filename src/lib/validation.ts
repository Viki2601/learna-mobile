const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required.";
    if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
    return null;
}

export interface PasswordCheck {
    valid: boolean;
    message: string | null;
    score: 0 | 1 | 2 | 3 | 4;
    label: "Empty" | "Weak" | "Fair" | "Good" | "Strong";
}

export function validatePassword(password: string): PasswordCheck {
    if (!password) {
        return { valid: false, message: "Password is required.", score: 0, label: "Empty" };
    }
    if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters.", score: 1, label: "Weak" };
    }

    let score = 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
    score = Math.min(score, 4);

    const labels: PasswordCheck["label"][] = ["Empty", "Weak", "Fair", "Good", "Strong"];
    return { valid: true, message: null, score: score as PasswordCheck["score"], label: labels[score] };
}

export function validateFullName(name: string): string | null {
    const trimmed = name.trim();
    if (!trimmed) return "Full name is required.";
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
    if (!confirm) return "Please confirm your password.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
}
