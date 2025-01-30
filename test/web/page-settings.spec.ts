/**
 * Copyright 2025 Google LLC
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

import {expect, test} from '@playwright/test';

import {pageConfigNames, privacyConfigNames} from '../../src/model/settings.js';

test.describe('Enable/disable checkboxes', () => {
  // Maps page-level setting labels to the GPT API functions/properties we
  // expect to see in code when the setting is enabled.
  const settings = [
    {label: pageConfigNames.sra!(), expectedText: 'enableSingleRequest'},
    {label: privacyConfigNames.ltd!(), expectedText: 'limitedAds'},
    {label: privacyConfigNames.npa!(), expectedText: 'nonPersonalizedAds'},
    {label: privacyConfigNames.rdp!(), expectedText: 'restrictDataProcessing'},
    {label: privacyConfigNames.tfcd!(), expectedText: 'childDirectedTreatment'},
    {label: privacyConfigNames.tfua!(), expectedText: 'underAgeOfConsent'},
  ];

  settings.forEach(({label, expectedText}) => {
    test(`${label} adds ${expectedText}`, async ({page}) => {
      await page.goto('/configurator');

      // Ensure the label is visible.
      await expect(page.getByLabel(label)).toBeVisible();

      // Enable the setting and ensure expected string appears in code.
      await page.getByLabel(label).click();
      await expect(page.locator('gpt-playground')).toContainText(expectedText);

      // Disable the setting and ensure expected string no longer appears in
      // code.
      await page.getByLabel(label).click();
      await expect(page.locator('gpt-playground')).not.toContainText(
        expectedText,
      );
    });
  });
});
