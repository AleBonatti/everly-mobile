import { Text, TouchableOpacity } from "react-native";

export function CategoryChip({ label, color, active, onPress }: { label: string; color: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="rounded-lg border px-2.5 py-1.5"
            style={{
                backgroundColor: active ? `${color}33` : "transparent",
                borderColor: active ? color : "#2e2722",
            }}>
            <Text className="text-xs" style={{ color: active ? color : "#857f7a" }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}
