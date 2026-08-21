import { apiFetch } from "./client";
import { forgotPasswordInputSchema, type ForgotPasswordInput } from "./schemas";

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const parsed = forgotPasswordInputSchema.parse(input);
    await apiFetch<unknown>("/auth/forgot-password", {
        method: "POST",
        body: parsed,
        isMobileAuthCall: true,
    });
}
