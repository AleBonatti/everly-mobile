import { useState } from "react";
import { useRouter } from "expo-router";
import { changePassword } from "../src/lib/api/auth";
import { ApiError, NetworkError } from "../src/lib/api/client";
import { useAuth } from "../src/lib/auth/AuthContext";
import { withMinDelay } from "../src/lib/withMinDelay";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { FormInput } from "../src/components/FormInput";
import { PrimaryButton } from "../src/components/PrimaryButton";

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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-screen pt-16">
            <View className="flex-row items-center justify-between border-b border-border px-4 pb-3.5 mb-6">
                <TouchableOpacity onPress={() => router.back()}>
                    <Text className="text-lg text-secondary">‹ Back</Text>
                </TouchableOpacity>
                <Text className="ml-3 text-xl font-bold text-emphasis">Settings</Text>
                <View className="w-16" />
            </View>

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView className="flex-1 px-4" contentContainerClassName="gap-8 pb-10" keyboardShouldPersistTaps="handled">
                    <View className="gap-3">
                        <Text className="text-md text-emphasis font-semibold uppercase tracking-wide">Profile</Text>

                        <View className="gap-1.5">
                            <Text className="text-[13px] font-semibold text-muted">Email</Text>
                            <Text className="text-sm text-secondary">{user?.email}</Text>
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-[13px] font-semibold text-muted">Name</Text>
                            <FormInput value={name} onChangeText={setName} placeholder="Your name" />
                        </View>

                        {nameError ? <Text className="text-xs text-red-400">{nameError}</Text> : null}

                        <PrimaryButton onPress={onSaveName} isLoading={isSavingName} label="Save name" className="self-start px-5 py-2.5" />
                    </View>

                    <View className="gap-3 border-t border-border pt-6">
                        <Text className="text-md font-semibold uppercase tracking-wide text-emphasis">Change password</Text>

                        <View className="gap-1.5">
                            <Text className="text-[13px] font-semibold text-muted">Current password</Text>
                            <FormInput value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="••••••••" />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-[13px] font-semibold text-muted">New password</Text>
                            <FormInput value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 8 characters" />
                        </View>

                        <View className="gap-1.5">
                            <Text className="text-[13px] font-semibold text-muted">Confirm new password</Text>
                            <FormInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat password" />
                        </View>

                        {passwordError ? <Text className="text-xs text-red-400">{passwordError}</Text> : null}
                        {passwordSuccess ? <Text className="text-xs text-success">Password updated.</Text> : null}

                        <PrimaryButton onPress={onChangePassword} isLoading={isChangingPassword} label="Update password" className="self-start px-5 py-2.5" />
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
