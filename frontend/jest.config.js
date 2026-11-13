/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testEnvironment: 'jsdom',
    // rxjs 7.8 no carga con la condición "browser"; "node" resuelve al build CommonJS.
    testEnvironmentOptions: {
        customExportConditions: ['node'],
    },
    moduleNameMapper: {
        '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
        '^@features/(.*)$': '<rootDir>/src/app/features/$1',
        '^@environments/(.*)$': '<rootDir>/src/app/environments/$1',
    },
    collectCoverageFrom: [
        'src/app/**/*.ts',
        // Sin lógica propia: tipos, DTOs, rutas, constantes y configuración.
        '!src/app/**/*.types.ts',
        '!src/app/**/*.model.ts',
        '!src/app/**/*.routes.ts',
        '!src/app/**/*.endpoints.ts',
        '!src/app/environments/**',
        '!src/app/app.config.ts',
    ],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
        },
    },
    coverageReporters: ['text-summary', 'lcov'],
};
