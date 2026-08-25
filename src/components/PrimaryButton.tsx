import { ActivityIndicator, Text, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { colors } from "../lib/theme";

type PrimaryButtonProps = TouchableOpacityProps & {
    label: string;
    loadingLabel?: string;
    isLoading?: boolean;
};

export function PrimaryButton({ label, loadingLabel, isLoading, disabled, className, ...rest }: PrimaryButtonProps) {
    return (
        <TouchableOpacity disabled={disabled || isLoading} className={`items-center rounded-lg bg-accent px-[22px] py-[13px] ${disabled || isLoading ? "opacity-60" : ""} ${className ?? ""}`} {...rest}>
            {isLoading ? <ActivityIndicator color={colors.bgElevated} /> : <Text className="text-[15px] font-semibold text-screen">{label}</Text>}
        </TouchableOpacity>
    );
}
