import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiError } from "../api/client";
import { authUserWithTokenSchema, loginInputSchema, registerInputSchema, type LoginInput, type RegisterInput } from "../api/schemas";
import { clearToken, getToken, setToken } from "./tokenStorage";
import { updateProfile } from "../api/auth";
import { withMinDelay } from "../withMinDelay";

type AuthUser = {
    id: string;
    name: string;
    email: string;
};

type AuthContextValue = {
    user: AuthUser | null;
    isLoading: boolean;
    login: (input: LoginInput) => Promise<void>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
    updateUserName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function restoreSession() {
            const token = await getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const me = await apiFetch<AuthUser>("/auth/me");
                setUser(me);
            } catch (error) {
                if (error instanceof ApiError && error.status === 401) {
                    await clearToken();
                }
            } finally {
                setIsLoading(false);
            }
        }
        restoreSession();
    }, []);

    async function login(input: LoginInput) {
        const parsed = loginInputSchema.parse(input);
        const result = await withMinDelay(
            apiFetch<unknown>("/auth/login", {
                method: "POST",
                body: parsed,
                isMobileAuthCall: true,
            }),
        );
        const authUser = authUserWithTokenSchema.parse(result);

        if (!authUser.token) {
            throw new Error("Login response did not include a token");
        }

        await setToken(authUser.token);
        setUser({ id: authUser.id, name: authUser.name, email: authUser.email });
    }

    async function register(input: RegisterInput) {
        const parsed = registerInputSchema.parse(input);
        const result = await withMinDelay(
            apiFetch<unknown>("/auth/register", {
                method: "POST",
                body: parsed,
                isMobileAuthCall: true,
            }),
        );
        const authUser = authUserWithTokenSchema.parse(result);

        if (!authUser.token) {
            throw new Error("Register response did not include a token");
        }

        await setToken(authUser.token);
        setUser({ id: authUser.id, name: authUser.name, email: authUser.email });
    }

    async function logout() {
        await clearToken();
        setUser(null);
    }

    async function updateUserName(name: string) {
        const updated = await updateProfile({ name });
        setUser(updated);
    }

    return <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUserName }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
