/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}", // あなたの環境に合わせてパスを調整
        "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
        screens: {
            portrait: { raw: "(orientation: portrait)" },
            landscape: { raw: "(orientation: landscape)" },
        },
    },
    plugins: [],
};
