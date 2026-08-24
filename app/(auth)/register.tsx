import { useState } from "react";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { useAuth } from "../../src/lib/auth/AuthContext";
import { FormInput } from "../../src/components/FormInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { AuthScreenLayout } from "../../src/components/AuthScreenLayout";

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
            setError("That email may already be in use.");
            setPassword("");
            setConfirmPassword("");
            setIsSubmitting(false);
        }
    }

    return (
        <AuthScreenLayout>
            <Text className="mb-1 text-2xl font-bold text-emphasis">Create your account</Text>
            <Text className="mb-[22px] text-sm text-secondary">Start your list of things worth doing.</Text>

            <View className="w-full max-w-sm gap-[15px]">
                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Name</Text>
                    <FormInput value={name} onChangeText={setName} placeholder="Maya Chen" />
                </View>

                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Email</Text>
                    <FormInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
                </View>

                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Password</Text>
                    <FormInput value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" />
                </View>

                <View className="gap-1.5">
                    <Text className="text-[13px] font-semibold text-muted">Confirm password</Text>
                    <FormInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat password" />
                </View>

                {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

                <PrimaryButton onPress={onSubmit} isLoading={isSubmitting} label="Create account" className="mt-1" />
            </View>

            <View className="mt-5 flex-row">
                <Text className="text-secondary">Already have an account? </Text>
                <Link href="/(auth)/login">
                    <Text className="font-semibold text-accent">Log in</Text>
                </Link>
            </View>
        </AuthScreenLayout>
    );
}
