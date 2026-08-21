import { useState } from "react";
import { useRouter } from "expo-router";
import { forgotPassword } from "../../src/lib/api/auth";
import { NetworkError } from "../../src/lib/api/client";
import { Image, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Keyboard, View } from "react-native";
import { withMinDelay } from "../../src/lib/withMinDelay";

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
            await withMinDelay(forgotPassword({ email }));
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-neutral-950">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 items-center justify-center px-6">
                    <Image source={require("../../assets/everly-logo.png")} className="mb-8 h-16 w-40" resizeMode="contain" />

                    {isSent ? (
                        <View className="w-full max-w-sm items-center gap-3.5">
                            <View className="h-13 w-13 items-center justify-center rounded-full bg-green-900">
                                <Text className="text-2xl text-green-400">✓</Text>
                            </View>
                            <Text className="text-lg text-neutral-100">Check your inbox</Text>
                            <Text className="text-center text-sm text-neutral-400">
                                We sent a password reset link to{"\n"}
                                <Text className="font-semibold text-neutral-200">{email}</Text>
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text className="mb-1 text-xl text-neutral-100">Reset your password</Text>
                            <Text className="mb-6 text-center text-sm text-neutral-400">Enter your email and we&apos;ll send you a link to reset your password.</Text>
                            <View className="w-full max-w-sm gap-4">
                                <View className="gap-1.5">
                                    <Text className="text-xs font-semibold text-neutral-400">Email</Text>
                                    <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                                </View>

                                {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

                                <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} className="items-center rounded-lg bg-amber-400 px-5 py-3">
                                    <Text className="font-semibold text-neutral-950">{isSubmitting ? "Sending..." : "Send reset link"}</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    <TouchableOpacity onPress={() => router.push("/(auth)/login")} className="mt-5">
                        <Text className="text-sm text-amber-400">← Back to log in</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
