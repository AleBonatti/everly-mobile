import { Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../src/lib/auth/AuthContext";

export default function Index() {
    const { user, logout } = useAuth();

    return (
        <View className="flex-1 items-center justify-center gap-4 bg-neutral-950">
            <Text className="text-neutral-100">Logged in as {user?.name}</Text>
            <TouchableOpacity onPress={logout} className="rounded-lg bg-neutral-800 px-4 py-2">
                <Text className="text-neutral-100">Log out</Text>
            </TouchableOpacity>
        </View>
    );
}
