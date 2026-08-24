import { apiFetch } from "./client";
import { authUserSchema, changePasswordInputSchema, updateProfileInputSchema, type AuthUser, type ChangePasswordInput, type UpdateProfileInput, forgotPasswordInputSchema, type ForgotPasswordInput } from "./schemas";

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const parsed = forgotPasswordInputSchema.parse(input);
    await apiFetch<unknown>("/auth/forgot-password", {
        method: "POST",
        body: parsed,
        isMobileAuthCall: true,
    });
}

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const parsed = updateProfileInputSchema.parse(input);
    const result = await apiFetch<unknown>("/auth/me", {
        method: "PATCH",
        body: parsed,
    });
    return authUserSchema.parse(result);
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
    const parsed = changePasswordInputSchema.parse(input);
    await apiFetch<unknown>("/auth/change-password", {
        method: "POST",
        body: parsed,
    });
}

export async function logoutOnServer(): Promise<void> {
    await apiFetch<unknown>("/auth/logout", {
        method: "POST",
    });
}
