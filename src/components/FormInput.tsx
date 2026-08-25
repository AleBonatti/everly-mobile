import { TextInput, type TextInputProps } from "react-native";
import { colors } from "../lib/theme";

export function FormInput(props: TextInputProps) {
    return <TextInput placeholderTextColor={colors.textMuted} className="w-full rounded-lg border border-border bg-elevated px-3.5 py-3.5 text-[15px] text-primary" {...props} />;
}
