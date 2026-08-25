import { Image, ScrollView, View, type ViewProps } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

export function AuthScreenLayout({ children, ...rest }: ViewProps) {
    return (
        <KeyboardAvoidingView behavior="padding" className="flex-1 bg-screen">
            <ScrollView contentContainerClassName="flex-grow items-center justify-center px-6" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
                <View className="w-full items-center" {...rest}>
                    <Image source={require("../../assets/everly-logo.png")} className="mb-12 h-20" resizeMode="contain" />
                    {children}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
