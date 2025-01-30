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

import {sampleAds} from '../../src/model/sample-ads.js';
import {SampleConfig, SampleSlotConfig} from '../../src/model/sample-config.js';
import {outOfPageFormatNames} from '../../src/model/settings.js';
import {encode} from '../../src/util/base64url.js';

const AD_UNIT_SELECTOR = 'input[name=adUnit]';
const CODE_EDITOR_SELECTOR = 'playground-file-editor';
const FORMAT_SELECTOR = 'select[name=formats]';
const TEMPLATE_SELECTOR = 'select[name=templates]';

const EMPTY_CUSTOM_SLOT: SampleSlotConfig = {
  adUnit: '/123/test',
  size: [100, 100],
};

test.describe('Ad unit path validation', () => {
  const adUnitCodeMaxLength = 100;
  const emptySlotConfig = JSON.stringify({
    slots: [EMPTY_CUSTOM_SLOT],
  } as SampleConfig);

  async function validateAdUnitPath(
    page: Page,
    adUnitPath: string,
    shouldBeValid = true,
  ): Promise<void> {
    await page.goto(`/configurator#config=${encode(emptySlotConfig)}`);
    await page.locator(AD_UNIT_SELECTOR).fill(adUnitPath);
    return shouldBeValid
      ? expect(page.locator(`${AD_UNIT_SELECTOR}:invalid`)).not.toBeVisible()
      : expect(page.locator(`${AD_UNIT_SELECTOR}:invalid`)).toBeVisible();
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

test.describe('Ad template select', () => {
  const oneEmptySlotConfig = JSON.stringify({
    slots: [EMPTY_CUSTOM_SLOT],
  } as SampleConfig);

  sampleAds.forEach(sampleAd => {
    test(`Selecting ${sampleAd.name()} changes code`, async ({page}) => {
      const templateSelect = page.locator(TEMPLATE_SELECTOR);

      await page.goto(`/configurator#config=${encode(oneEmptySlotConfig)}`);
      await expect(templateSelect).toBeVisible();

      const originalCode = await page.locator(CODE_EDITOR_SELECTOR).screenshot({
        animations: 'disabled',
      });
      await templateSelect.selectOption(sampleAd.name());
      const newCode = await page.locator(CODE_EDITOR_SELECTOR).screenshot({
        animations: 'disabled',
      });
      await expect(newCode).not.toEqual(originalCode);
    });
  });
});

test.describe('Ad format select', () => {
  const excludedFormats = ['GAME_MANUAL_INTERSTITIAL', 'REWARDED'];

  const oneEmptySlotConfig = JSON.stringify({
    slots: [EMPTY_CUSTOM_SLOT],
  } as SampleConfig);

  Object.entries(outOfPageFormatNames)
    .filter(format => !excludedFormats.includes(format[0]))
    .forEach(format => {
      const formatName = format[1]();

      test(`Selecting ${formatName} updates code`, async ({page}) => {
        await page.goto(`/configurator#config=${encode(oneEmptySlotConfig)}`);
        await expect(page.locator(FORMAT_SELECTOR)).toBeVisible();

        await page.locator(FORMAT_SELECTOR).selectOption(formatName);
        await expect(page.locator(CODE_EDITOR_SELECTOR)).toContainText(
          formatName,
        );

        await page.locator(FORMAT_SELECTOR).selectOption('None');
        await expect(page.locator(CODE_EDITOR_SELECTOR)).not.toContainText(
          formatName,
        );
      });
    });
});

test.describe('Ad format exclusions', () => {
  const twoEmptySlotConfig = JSON.stringify({
    slots: [EMPTY_CUSTOM_SLOT, EMPTY_CUSTOM_SLOT],
  } as SampleConfig);

  async function assertAnchorFormatExclusion(page: Page, selector: string) {
    const select = page.locator(selector);

    await page.goto(`/configurator#config=${encode(twoEmptySlotConfig)}`);
    await expect(select).toHaveCount(2);

    // Ensure that the slot that selects an anchor format can freely switch
    // between them.
    await select.first().selectOption(outOfPageFormatNames.BOTTOM_ANCHOR());
    await expect(
      select.first().getByText(outOfPageFormatNames.TOP_ANCHOR()),
    ).not.toBeDisabled();

    // Ensure other slots aren't able to select either format.
    await expect(
      select.nth(1).getByText(outOfPageFormatNames.BOTTOM_ANCHOR()),
    ).toBeDisabled();
    await expect(
      select.nth(1).getByText(outOfPageFormatNames.TOP_ANCHOR()),
    ).toBeDisabled();
  }

  async function assertIntersitialFormatExclusion(
    page: Page,
    selector: string,
  ) {
    const select = page.locator(selector);

    await page.goto(`/configurator#config=${encode(twoEmptySlotConfig)}`);
    await expect(select).toHaveCount(2);

    // Ensure that slot 1 can select the interstitial format.
    await select.first().selectOption(outOfPageFormatNames.INTERSTITIAL());

    // Ensure that slot 2 can't select the interstitial format.
    await expect(
      select.nth(1).getByText(outOfPageFormatNames.INTERSTITIAL()),
    ).toBeDisabled();
  }

  async function assertSideRailFormatExclusion(page: Page, selector: string) {
    const select = page.locator(selector);

    await page.goto(`/configurator#config=${encode(twoEmptySlotConfig)}`);
    await expect(select).toHaveCount(2);

    // Ensure that slot 1 has access to both side rail formats.
    await select.first().selectOption(outOfPageFormatNames.LEFT_SIDE_RAIL());
    await expect(
      select.first().getByText(outOfPageFormatNames.RIGHT_SIDE_RAIL()),
    ).not.toBeDisabled();

    // Ensure that slot 2 can't select left side rail, but can select right side
    // rail.
    await expect(
      select.nth(1).getByText(outOfPageFormatNames.LEFT_SIDE_RAIL()),
    ).toBeDisabled();
    await expect(
      select.nth(1).getByText(outOfPageFormatNames.RIGHT_SIDE_RAIL()),
    ).not.toBeDisabled();
    await select.nth(1).selectOption(outOfPageFormatNames.RIGHT_SIDE_RAIL());

    // Ensure that slot 1 now can't select right side rail.
    await expect(
      select.first().getByText(outOfPageFormatNames.RIGHT_SIDE_RAIL()),
    ).toBeDisabled();
  }

  test('Ad format select: only 1 anchor format can be selected', async ({
    page,
  }) => {
    await assertAnchorFormatExclusion(page, FORMAT_SELECTOR);
  });

  test('Template select: only 1 anchor format can be selected', async ({
    page,
  }) => {
    await assertAnchorFormatExclusion(page, TEMPLATE_SELECTOR);
  });

  test('Ad format select: only 1 interstitial format ad can be selected', async ({
    page,
  }) => {
    await assertIntersitialFormatExclusion(page, FORMAT_SELECTOR);
  });

  test('Template select: only 1 interstitial format ad can be selected', async ({
    page,
  }) => {
    await assertIntersitialFormatExclusion(page, TEMPLATE_SELECTOR);
  });

  test('Ad format select: only 1 of each side rail format can be selected', async ({
    page,
  }) => {
    await assertSideRailFormatExclusion(page, FORMAT_SELECTOR);
  });

  test('Template select: only 1 of each side rail format can be selected', async ({
    page,
  }) => {
    await assertSideRailFormatExclusion(page, TEMPLATE_SELECTOR);
  });
});
