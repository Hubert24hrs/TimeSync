/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)', '<rootDir>/supabase/functions/**/__tests__/**/*.test.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|luxon)',
    ],
};
