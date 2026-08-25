import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "../global.css";
import { AuthProvider, useAuth } from "../src/lib/auth/AuthContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { colors } from "../src/lib/theme";

const queryClient = new QueryClient();

function RootNavigation() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!user && !inAuthGroup) {
            router.replace("/login");
        } else if (user && inAuthGroup) {
            router.replace("/");
        }
    }, [user, isLoading, segments, router]);

    if (isLoading) {
        return null;
    }

    return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.screen } }} />;
}

export default function RootLayout() {
    return (
        <KeyboardProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <RootNavigation />
                </AuthProvider>
            </QueryClientProvider>
        </KeyboardProvider>
    );
}
