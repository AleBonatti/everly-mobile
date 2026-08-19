import { useState } from "react";
import { Link } from "expo-router";
import { ApiError, NetworkError } from "../../src/lib/api/client";
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, View } from "react-native";
import { useAuth } from "../../src/lib/auth/AuthContext";

export default function RegisterScreen() {
    const { register } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit() {
        if (!name.trim() || !email.trim() || !password) {
            setError("Please fill in all fields.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await register({ name, email, password });
        } catch (err) {
            console.error("Register error:", err);
            setError("Could not create account. That email may already be in use.");
            setPassword("");
            setConfirmPassword("");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-neutral-950">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="mb-1 text-xl text-neutral-100">Welcome back</Text>
                    <Text className="mb-6 text-sm text-neutral-400">Log in to see your list.</Text>r
                    <View className="w-full max-w-sm gap-4">
                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">Email</Text>
                            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">Password</Text>
                            <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                        </View>

                        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

                        <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} className="items-center rounded-lg bg-amber-400 px-5 py-3">
                            <Text className="font-semibold text-neutral-950">{isSubmitting ? "Logging in..." : "Log in"}</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="mt-5 flex-row">
                        <Text className="text-sm text-neutral-400">Don't have an account? </Text>
                        <Link href="/(auth)/register">
                            <Text className="text-sm text-amber-400">Sign up</Text>
                        </Link>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
