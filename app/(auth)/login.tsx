import { useState } from "react";
import { Link } from "expo-router";
import { ApiError, NetworkError } from "../../src/lib/api/client";
import { Text, View } from "react-native";
import { useAuth } from "../../src/lib/auth/AuthContext";
import { FormInput } from "../../src/components/FormInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { AuthScreenLayout } from "../../src/components/AuthScreenLayout";

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit() {
        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await login({ email, password });
        } catch (err) {
            if (err instanceof NetworkError) {
                setError(err.message);
            } else if (err instanceof ApiError) {
                setError("Invalid email or password.");
            } else {
                setError("Something went wrong. Please try again.");
            }
            setPassword("");
            setIsSubmitting(false);
        }
    }

    return (
        <AuthScreenLayout>
            <Text className="mb-1 text-2xl font-bold text-emphasis">Welcome back</Text>
            <Text className="mb-[22px] text-sm text-secondary">Log in to see your list.</Text>
            <View className="w-full max-w-sm gap-[15px]">
                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Email</Text>
                    <FormInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
                </View>

                <View className="gap-1.5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-[13px] font-semibold text-muted">Password</Text>
                        <Link href="/(auth)/forgot-password">
                            <Text className="text-sm text-accent-muted">Forgot password?</Text>
                        </Link>
                    </View>
                    <FormInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
                </View>

                {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

                <PrimaryButton onPress={onSubmit} isLoading={isSubmitting} label="Log in" className="mt-1" />
            </View>
            <View className="mt-5 flex-row">
                <Text className="font-semibold text-secondary">Don&apos;t have an account? </Text>
                <Link href="/(auth)/register">
                    <Text className="font-semibold text-accent">Sign up</Text>
                </Link>
            </View>
        </AuthScreenLayout>
    );
}
