export default {
  testEnvironment: "node",
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    "^.+\\.js$": ["babel-jest", { "presets": [["@babel/preset-env", { "targets": { "node": "current" } }]] }]
  },
  moduleFileExtensions: ["js", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.js$",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/jest.setup.js']
};