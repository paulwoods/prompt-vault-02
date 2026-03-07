import {defineConfig, devices} from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({path: path.resolve(__dirname, '.env.test')});

export default defineConfig({
    testDir: './tests',
    outputDir: './test-results',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: process.env.CI
        ? [['list'], ['junit', {outputFile: 'test-results/junit.xml'}]]
        : [['html', {open: 'on-failure'}]],

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10_000,
    },

    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
        {
            name: 'api-tests',
            testDir: './tests/api',
            use: {baseURL: process.env.API_BASE_URL || 'http://localhost:8080'},
        },
    ],

    webServer: [
        {
            command: 'npm run dev',
            url: 'http://localhost:5173',
            cwd: '../frontend',
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
        {
            command: './mvnw spring-boot:run',
            url: 'http://localhost:8080/actuator/health',
            cwd: '../backend',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
    ],
});
