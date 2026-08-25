export default {
    expo: {
        name: "Everly",
        slug: "everly-mobile",
        version: "1.2.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        plugins: [
            "expo-router",
            "expo-status-bar",
            "expo-secure-store",
            [
                "expo-image-picker",
                {
                    photosPermission: "Everly uses your photo library to add photos to your items.",
                    cameraPermission: "Everly uses your camera to add photos to your items.",
                    microphonePermission: false,
                },
            ],
            [
                "expo-splash-screen",
                {
                    image: "./assets/icon.png",
                    backgroundColor: "#0e0a07",
                    imageWidth: 200,
                },
            ],
            [
                "react-native-maps",
                {
                    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            ],
            [
                "expo-location",
                {
                    locationWhenInUsePermission: "Everly uses your location to center the map when adding an item's location.",
                },
            ],
        ],
        scheme: "everlymobile",
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.alebonatti.everly",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
            },
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#0e0a07",
                foregroundImage: "./assets/adaptive-icon-foreground.png",
            },
            predictiveBackGestureEnabled: false,
            package: "com.alebonatti.everly",
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
        },
        web: {
            favicon: "./assets/favicon.png",
        },
        extra: {
            router: {},
            eas: {
                projectId: "af2bc046-38db-4045-b1f3-0992bbcb4d68",
            },
        },
    },
};
