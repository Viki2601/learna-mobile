module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: { module: "commonjs", esModuleInterop: true, types: ["jest"] } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^react-native-url-polyfill/auto$": "<rootDir>/src/test-utils/emptyModule.js",
    "^@react-native-async-storage/async-storage$": "<rootDir>/src/test-utils/asyncStorageMock.js",
  },
};
