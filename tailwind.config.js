module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                screen: "#0e0a07",
                elevated: "#1a1511",
                border: {
                    DEFAULT: "#332c27",
                },
                emphasis: "#f0eae5",
                primary: "#eae3de",
                secondary: "#a9a39e",
                muted: "#857f7a",
                accent: {
                    DEFAULT: "#e0af3b",
                    muted: "#c79e41",
                },
                success: {
                    DEFAULT: "#76cf8a",
                    bg: "#15301b",
                },
            },
        },
    },
    plugins: [],
};
