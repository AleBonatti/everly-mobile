import { useState } from "react";
import { Link } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
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
            setError("Could not create account. That email may already be in use.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <View className="flex-1 items-center justify-center bg-neutral-950 px-6">
            <Text className="mb-1 text-xl text-neutral-100">Create your account</Text>
            <Text className="mb-6 text-sm text-neutral-400">Start your list of things worth doing.</Text>

            <View className="w-full max-w-sm gap-4">
                <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-neutral-400">Name</Text>
                    <TextInput value={name} onChangeText={setName} placeholder="Maya Chen" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                </View>

                <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-neutral-400">Email</Text>
                    <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                </View>

                <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-neutral-400">Password</Text>
                    <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                </View>

                <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-neutral-400">Confirm password</Text>
                    <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat password" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                </View>

                {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

                <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} className="items-center rounded-lg bg-amber-400 px-5 py-3">
                    <Text className="font-semibold text-neutral-950">{isSubmitting ? "Creating account..." : "Create account"}</Text>
                </TouchableOpacity>
            </View>

            <View className="mt-5 flex-row">
                <Text className="text-sm text-neutral-400">Already have an account? </Text>
                <Link href="/(auth)/login">
                    <Text className="text-sm text-amber-400">Log in</Text>
                </Link>
            </View>
        </View>
    );
}
