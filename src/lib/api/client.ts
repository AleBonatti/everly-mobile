import { getToken } from "../auth/tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
}

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export class NetworkError extends Error {
    constructor() {
        super("Could not reach the server. Check your connection and try again.");
    }
}

type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    isMobileAuthCall?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, isMobileAuthCall = false } = options;

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (isMobileAuthCall) {
        headers["X-Client"] = "mobile";
    } else {
        const token = await getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new NetworkError();
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new ApiError(response.status, errorBody.message ?? "Request failed");
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}
