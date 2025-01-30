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

import {expect, Page, test} from '@playwright/test';

import {SampleConfig} from '../../src/model/sample-config.js';
import {encode} from '../../src/util/base64url.js';

test.describe('Ad unit path validation', () => {
  const adUnitCodeMaxLength = 100;
  const emptyCustomSlot = JSON.stringify({
    slots: [
      {
        adUnit: '',
        size: [100, 100],
      },
    ],
  } as SampleConfig);

  async function validateAdUnitPath(
    page: Page,
    adUnitPath: string,
    shouldBeValid = true,
  ): Promise<void> {
    await page.goto(`/configurator#config=${encode(emptyCustomSlot)}`);
    await page.locator('input[name=adUnit]').fill(adUnitPath);
    return shouldBeValid
      ? expect(page.locator('input[name=adUnit]:invalid')).not.toBeVisible()
      : expect(page.locator('input[name=adUnit]:invalid')).toBeVisible();
  }

  test('Supported ad unit code characters are valid.', async ({page}) => {
    await validateAdUnitPath(
      page,
      '/123/1234567890abcdefghijklmnopqrstuvwxyz_-.*/\\![:()',
    );
  });

  test('Max length ad unit code is valid', async ({page}) => {
    const adUnitCode = `/${'a'.repeat(adUnitCodeMaxLength)}`;
    await validateAdUnitPath(page, `/123${adUnitCode}`);
  });

  test('Multiple max length ad unit codes are valid', async ({page}) => {
    const adUnitCode = `/${'a'.repeat(adUnitCodeMaxLength)}`;
    await validateAdUnitPath(page, `/123${adUnitCode.repeat(3)}`);
  });

  test('MCM network code is valid', async ({page}) => {
    await validateAdUnitPath(page, '/123,123/Test');
  });

  test('No ad unit code code is valid', async ({page}) => {
    await validateAdUnitPath(page, '/123');
  });

  test('Trailing slash is valid', async ({page}) => {
    await validateAdUnitPath(page, '/123/');
  });

  test('Missing network code is invalid', async ({page}) => {
    await validateAdUnitPath(page, '/Test/Test', false);
  });

  test('Unsupported ad unit code characters are invalid', async ({page}) => {
    await validateAdUnitPath(page, '/123/~@#$%^&+=];",', false);
  });

  test('Ad unit code exceeding max length is invalid', async ({page}) => {
    const adUnitCode = `/${'a'.repeat(adUnitCodeMaxLength + 1)}`;
    await validateAdUnitPath(page, `/123${adUnitCode}`, false);
  });
});
