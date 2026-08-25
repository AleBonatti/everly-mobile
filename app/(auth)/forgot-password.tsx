import { useState } from "react";
import { useRouter } from "expo-router";
import { forgotPassword } from "../../src/lib/api/auth";
import { NetworkError } from "../../src/lib/api/client";
import { FormInput } from "../../src/components/FormInput";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { Text, TouchableOpacity, View } from "react-native";
import { AuthScreenLayout } from "../../src/components/AuthScreenLayout";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    async function onSubmit() {
        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        setError("");
        setIsSubmitting(true);
        try {
            await forgotPassword({ email });
            setIsSent(true);
        } catch (err) {
            if (err instanceof NetworkError) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthScreenLayout>
            {isSent ? (
                <View className="w-full max-w-sm items-center gap-3.5">
                    <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-success-bg">
                        <Text className="text-[22px] text-success">✓</Text>
                    </View>
                    <Text className="text-lg text-emphasis">Check your inbox</Text>
                    <Text className="text-center text-[13px] leading-6 text-secondary">
                        We sent a password reset link to{"\n"}
                        <Text className="font-semibold text-primary">{email}</Text>
                    </Text>
                </View>
            ) : (
                <>
                    <Text className="mb-1 text-2xl font-bold text-emphasis">Reset your password</Text>
                    <Text className="mb-[22px] text-center text-sm leading-[1.5] text-secondary">Enter your email and we&apos;ll send you a link to reset your password.</Text>
                    <View className="w-full max-w-sm gap-[15px]">
                        <View className="gap-1.5">
                            <Text className="text-[13px] font-semibold text-muted">Email</Text>
                            <FormInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
                        </View>

                        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

                        <PrimaryButton onPress={onSubmit} isLoading={isSubmitting} label="Send reset link" />
                    </View>
                </>
            )}

            <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="mt-5">
                <Text className="font-semibold text-accent">← Back to log in</Text>
            </TouchableOpacity>
        </AuthScreenLayout>
    );
}
