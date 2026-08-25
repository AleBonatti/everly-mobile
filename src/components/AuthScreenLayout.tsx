import { Image, Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, View, type ViewProps } from "react-native";

export function AuthScreenLayout({ children, ...rest }: ViewProps) {
    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-screen">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 items-center justify-center px-6" {...rest}>
                    <Image source={require("../../assets/everly-logo.png")} className="mb-12 h-20" resizeMode="contain" />
                    {children}
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}
