/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {defineConfig, devices} from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './test/web',
  testMatch: /.*\.spec\.ts/,
  /* Run tests in files in parallel. */
  // fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code.
   */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 4 : 0,
  /* Use 100% of the available CPU cores in CI environments. */
  workers: process.env.CI ? '100%' : undefined,
  /* Stop running tests after the first failure in CI environments. */
  maxFailures: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Shared settings for all the projects below. See
     https://playwright.dev/docs/api/class-testoptions. */
  expect: {
    /**
     * The acceptable ratio of pixels different from the total # of pixels, when
     * comparing screenshots.
     */
    toHaveScreenshot: {maxDiffPixelRatio: 0.01},
    toMatchSnapshot: {maxDiffPixelRatio: 0.01}
  },
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:8000',

    /* Collect trace when retrying the failed test. See
       https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers. */
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },

    {
      name: 'firefox',
      use: {...devices['Desktop Firefox']},
    },

    {
      name: 'webkit',
      use: {...devices['Desktop Safari']},
    },
  ],

  /* Run the local dev server before starting tests. */
  webServer: {
    command: 'npm run serve',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: !process.env.CI,
  },
});
