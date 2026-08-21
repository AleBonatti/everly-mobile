import { useState } from "react";
import { useRouter } from "expo-router";
import { changePassword } from "../src/lib/api/auth";
import { ApiError, NetworkError } from "../src/lib/api/client";
import { useAuth } from "../src/lib/auth/AuthContext";
import { withMinDelay } from "../src/lib/withMinDelay";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

export default function SettingsScreen() {
    const router = useRouter();
    const { user, updateUserName } = useAuth();

    const [name, setName] = useState(user?.name ?? "");
    const [isSavingName, setIsSavingName] = useState(false);
    const [nameError, setNameError] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    async function onSaveName() {
        if (!name.trim()) {
            setNameError("Name is required.");
            return;
        }
        setNameError("");
        setIsSavingName(true);
        try {
            await withMinDelay(updateUserName(name.trim()));
            Alert.alert("Saved", "Your name has been updated.");
        } catch {
            setNameError("Something went wrong. Please try again.");
        } finally {
            setIsSavingName(false);
        }
    }

    async function onChangePassword() {
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        setPasswordError("");
        setPasswordSuccess(false);
        setIsChangingPassword(true);
        try {
            await withMinDelay(changePassword({ currentPassword, password: newPassword }));
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            if (err instanceof NetworkError) {
                setPasswordError(err.message);
            } else if (err instanceof ApiError && err.status === 400) {
                setPasswordError("Current password is incorrect.");
            } else {
                setPasswordError("Something went wrong. Please try again.");
            }
        } finally {
            setIsChangingPassword(false);
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-neutral-950 pt-16">
            <View className="flex-row items-center px-4 pb-4">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-neutral-400">‹ Back</Text>
                </TouchableOpacity>
                <Text className="ml-3 text-lg font-bold text-neutral-100">Settings</Text>
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView className="flex-1 px-4" contentContainerClassName="gap-8 pb-10" keyboardShouldPersistTaps="handled">
                    <View className="gap-3">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Profile</Text>

                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">Email</Text>
                            <Text className="text-sm text-neutral-500">{user?.email}</Text>
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">Name</Text>
                            <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                        </View>

                        {nameError ? <Text className="text-xs text-red-400">{nameError}</Text> : null}

                        <TouchableOpacity onPress={onSaveName} disabled={isSavingName} className="items-center rounded-lg bg-amber-400 px-5 py-2.5">
                            {isSavingName ? <ActivityIndicator color="#0e0a07" /> : <Text className="text-sm font-semibold text-neutral-950">Save name</Text>}
                        </TouchableOpacity>
                    </View>

                    <View className="gap-3 border-t border-neutral-800 pt-6">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Change password</Text>

                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">Current password</Text>
                            <TextInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">New password</Text>
                            <TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-xs font-semibold text-neutral-400">Confirm new password</Text>
                            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat password" placeholderTextColor="#71717a" className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-neutral-100" />
                        </View>

                        {passwordError ? <Text className="text-xs text-red-400">{passwordError}</Text> : null}
                        {passwordSuccess ? <Text className="text-xs text-green-400">Password updated.</Text> : null}

                        <TouchableOpacity onPress={onChangePassword} disabled={isChangingPassword} className="items-center rounded-lg bg-amber-400 px-5 py-2.5">
                            {isChangingPassword ? <ActivityIndicator color="#0e0a07" /> : <Text className="text-sm font-semibold text-neutral-950">Update password</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
