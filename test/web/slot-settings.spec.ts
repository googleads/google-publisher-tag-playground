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

import {sampleAds} from '../../src/model/sample-ads.js';
import {SampleConfig, SampleSlotConfig} from '../../src/model/sample-config.js';
import {
  configNames,
  interstitialConfigNames,
  interstitialTriggerNames,
  outOfPageFormatNames,
} from '../../src/model/settings.js';

import {Configurator, expect, test} from './fixtures/configurator.js';

const AD_UNIT_TEXT_FIELD_LABEL = 'Ad unit path';
const SLOT_SETTINGS_TITLE = 'Slot settings';
const FORMAT_SELECT_LABEL = 'Out-of-page format';
const TEMPLATE_SELECT_LABEL = 'Slot template';

const EMPTY_CUSTOM_SLOT: SampleSlotConfig = {
  adUnit: '/123/test',
  size: [100, 100],
};

test.describe('Ad unit path validation', () => {
  const adUnitCodeMaxLength = 100;

  test.use({
    config: {
      slots: [EMPTY_CUSTOM_SLOT],
    } as SampleConfig,
  });

  async function validateAdUnitPath(
    configurator: Configurator,
    adUnitPath: string,
    shouldBeValid = true,
  ): Promise<void> {
    const adUnitInput = configurator.getTextField(
      AD_UNIT_TEXT_FIELD_LABEL,
      configurator.getConfigSection(SLOT_SETTINGS_TITLE),
    );
    await adUnitInput.fill(adUnitPath);

    return shouldBeValid
      ? expect(adUnitInput).toBeValid()
      : expect(adUnitInput).not.toBeValid();
  }

  test('Supported ad unit code characters are valid.', async ({
    configurator,
  }) => {
    await validateAdUnitPath(
      configurator,
      '/123/1234567890abcdefghijklmnopqrstuvwxyz_-.*/\\![:()',
    );
  });

  test('Max length ad unit code is valid', async ({configurator}) => {
    const adUnitCode = `/${'a'.repeat(adUnitCodeMaxLength)}`;
    await validateAdUnitPath(configurator, `/123${adUnitCode}`);
  });

  test('Multiple max length ad unit codes are valid', async ({
    configurator,
  }) => {
    const adUnitCode = `/${'a'.repeat(adUnitCodeMaxLength)}`;
    await validateAdUnitPath(configurator, `/123${adUnitCode.repeat(3)}`);
  });

  test('MCM network code is valid', async ({configurator}) => {
    await validateAdUnitPath(configurator, '/123,123/Test');
  });

  test('No ad unit code code is valid', async ({configurator}) => {
    await validateAdUnitPath(configurator, '/123');
  });

  test('Trailing slash is valid', async ({configurator}) => {
    await validateAdUnitPath(configurator, '/123/');
  });

  test('Missing network code is invalid', async ({configurator}) => {
    await validateAdUnitPath(configurator, '/Test/Test', false);
  });

  test('Unsupported ad unit code characters are invalid', async ({
    configurator,
  }) => {
    await validateAdUnitPath(configurator, '/123/~@#$%^&+=];",', false);
  });

  test('Ad unit code exceeding max length is invalid', async ({
    configurator,
  }) => {
    const adUnitCode = `/${'a'.repeat(adUnitCodeMaxLength + 1)}`;
    await validateAdUnitPath(configurator, `/123${adUnitCode}`, false);
  });
});

test.describe('Ad template select', () => {
  test.use({
    config: {
      slots: [EMPTY_CUSTOM_SLOT],
    } as SampleConfig,
  });

  test('Slot settings show/hide as expected', async ({configurator}) => {
    const templateSelect = configurator.getSelect(
      TEMPLATE_SELECT_LABEL,
      configurator.getConfigSection(SLOT_SETTINGS_TITLE),
    );
    await expect(templateSelect).toBeVisible();

    // Ensure page loads with slot settings visible.
    await expect(
      configurator.getTextField(AD_UNIT_TEXT_FIELD_LABEL),
    ).toBeVisible();

    // Ensure selecting a template hides slot settings.
    await configurator.selectOption(templateSelect, sampleAds[0].name());
    await expect(
      configurator.getTextField(AD_UNIT_TEXT_FIELD_LABEL),
    ).not.toBeVisible();

    // Ensure selecting custom shows slot settings again.
    await configurator.selectOption(templateSelect, 'Custom');
    await expect(
      configurator.getTextField(AD_UNIT_TEXT_FIELD_LABEL),
    ).toBeVisible();
  });

  sampleAds.forEach(sampleAd => {
    test(`Selecting ${sampleAd.name()} changes code`, async ({
      configurator,
    }) => {
      const templateSelect = configurator.getSelect(
        TEMPLATE_SELECT_LABEL,
        configurator.getConfigSection(SLOT_SETTINGS_TITLE),
      );
      await expect(templateSelect).toBeVisible();

      const originalCode = await configurator.getCodeEditorContents();

      await configurator.selectOption(templateSelect, sampleAd.name());
      const newCode = await configurator.getCodeEditorContents();

      expect(newCode).not.toEqual(originalCode);
    });
  });
});

test.describe('Configure targeting', () => {
  const testKey = 'test-key';
  const testValue = 'test-value';

  test.use({
    config: {
      slots: [EMPTY_CUSTOM_SLOT],
    } as SampleConfig,
  });

  test('Adding/removing KV updates code', async ({configurator, page}) => {
    const targetingInput = configurator.getChipInput(
      'Slot settings',
      'Targeting',
    );

    await targetingInput.addValue(`${testKey}=${testValue}`);
    await expect(page.locator('gpt-playground')).toContainText(testKey);
    await expect(page.locator('gpt-playground')).toContainText(testValue);

    await targetingInput.deleteValue(`${testKey}=${testValue}`);
    await expect(page.locator('gpt-playground')).not.toContainText(testKey);
    await expect(page.locator('gpt-playground')).not.toContainText(testValue);
  });

  test('Editing KV removes it from code', async ({configurator, page}) => {
    const targetingInput = configurator.getChipInput(
      'Slot settings',
      'Targeting',
    );

    await targetingInput.addValue(`${testKey}=${testValue}`);
    await expect(page.locator('gpt-playground')).toContainText(testKey);
    await expect(page.locator('gpt-playground')).toContainText(testValue);

    await targetingInput.editValue(`${testKey}=${testValue}`);
    await expect(page.locator('gpt-playground')).not.toContainText(testKey);
    await expect(page.locator('gpt-playground')).not.toContainText(testValue);
  });

  test('Invalid KV does not appear in code', async ({configurator, page}) => {
    const targetingInput = configurator.getChipInput(
      'Slot settings',
      'Targeting',
    );

    await targetingInput.addValue(`1${testKey}=${testValue}`);
    await expect(page.locator('gpt-playground')).not.toContainText(
      `1${testKey}`,
    );
    await expect(page.locator('gpt-playground')).not.toContainText(
      `${testValue}`,
    );
  });

  test.describe('Prepopulation', () => {
    test.use({
      config: {
        slots: [
          {
            ...EMPTY_CUSTOM_SLOT,
            config: {targeting: {[testKey]: testValue}},
          },
        ],
      },
    });

    test('Prepopulated targeting KV appears in code', async ({
      configurator,
      page,
    }) => {
      const targetingInput = configurator.getChipInput(
        'Slot settings',
        'Targeting',
      );
      await expect(
        targetingInput.getChip(`${testKey}=${testValue}`),
      ).toBeVisible();
      await expect(page.locator('gpt-playground')).toContainText(testKey);
      await expect(page.locator('gpt-playground')).toContainText(testValue);
    });
  });
});

test.describe('Configure ad exclusions', () => {
  const testLabel = 'test-label';

  test.use({
    config: {
      slots: [EMPTY_CUSTOM_SLOT],
    } as SampleConfig,
  });

  test('Adding/removing label updates code', async ({configurator, page}) => {
    const exclusionInput = configurator.getChipInput(
      'Slot settings',
      'Ad exclusion labels',
    );

    await exclusionInput.addValue(testLabel);
    await expect(page.locator('gpt-playground')).toContainText(
      'categoryExclusion',
    );
    await expect(page.locator('gpt-playground')).toContainText(testLabel);

    await exclusionInput.deleteValue(testLabel);
    await expect(page.locator('gpt-playground')).not.toContainText(
      'categoryExclusion',
    );
    await expect(page.locator('gpt-playground')).not.toContainText(testLabel);
  });

  test('Editing label removes it from code', async ({configurator, page}) => {
    const exclusionInput = configurator.getChipInput(
      'Slot settings',
      'Ad exclusion labels',
    );

    await exclusionInput.addValue(testLabel);
    await expect(page.locator('gpt-playground')).toContainText(
      'categoryExclusion',
    );
    await expect(page.locator('gpt-playground')).toContainText(testLabel);

    await exclusionInput.editValue(testLabel);
    await expect(page.locator('gpt-playground')).not.toContainText(
      'categoryExclusion',
    );
    await expect(page.locator('gpt-playground')).not.toContainText(testLabel);
  });

  test('Invalid label does not appear in code', async ({
    configurator,
    page,
  }) => {
    const exclusionInput = configurator.getChipInput(
      'Slot settings',
      'Ad exclusion labels',
    );

    const invalidLabel = 'a'.repeat(128);
    await exclusionInput.addValue(invalidLabel);
    await expect(page.locator('gpt-playground')).not.toContainText(
      'categoryExclusion',
    );
    await expect(page.locator('gpt-playground')).not.toContainText(
      invalidLabel,
    );
  });

  test.describe('Prepopulation', () => {
    test.use({
      config: {
        slots: [
          {
            ...EMPTY_CUSTOM_SLOT,
            config: {categoryExclusion: [testLabel]},
          },
        ],
      },
    });

    test('Prepopulated ad exclusion label appears in code', async ({
      configurator,
      page,
    }) => {
      const exclusionInput = configurator.getChipInput(
        'Slot settings',
        'Ad exclusion labels',
      );
      await expect(exclusionInput.getChip(testLabel)).toBeVisible();
      await expect(page.locator('gpt-playground')).toContainText(
        'categoryExclusion',
      );
      await expect(page.locator('gpt-playground')).toContainText(testLabel);
    });
  });
});

test.describe('Ad format select', () => {
  const excludedFormats = [
    'AD_INTENTS',
    'GAME_MANUAL_INTERSTITIAL',
    'REWARDED',
  ];

  test.use({
    config: {
      slots: [EMPTY_CUSTOM_SLOT],
    } as SampleConfig,
  });

  Object.entries(outOfPageFormatNames)
    .filter(format => !excludedFormats.includes(format[0]))
    .forEach(format => {
      const formatName = format[1]();

      test(`Selecting ${formatName} updates code`, async ({configurator}) => {
        const formatSelect = configurator.getSelect(
          FORMAT_SELECT_LABEL,
          configurator.getConfigSection(SLOT_SETTINGS_TITLE),
        );
        await expect(formatSelect).toBeVisible();

        await configurator.selectOption(formatSelect, formatName);
        expect(await configurator.getCodeEditorContents()).toContain(
          formatName,
        );

        await configurator.selectOption(formatSelect, 'None');
        expect(await configurator.getCodeEditorContents()).not.toContain(
          formatName,
        );
      });
    });
});

test.describe('Ad format exclusions', () => {
  test.use({
    config: {
      slots: [EMPTY_CUSTOM_SLOT, EMPTY_CUSTOM_SLOT],
    },
  });

  async function assertAnchorFormatExclusion(
    configurator: Configurator,
    label: string,
  ) {
    const select = configurator.getSelect(
      label,
      configurator.getConfigSection(SLOT_SETTINGS_TITLE),
    );
    await expect(select).toHaveCount(2);

    // Ensure that the slot that selects an anchor format can freely switch
    // between them.
    await configurator.selectOption(
      select.first(),
      outOfPageFormatNames.BOTTOM_ANCHOR(),
    );
    await expect(
      configurator.getSelectOption(
        select.first(),
        outOfPageFormatNames.BOTTOM_ANCHOR(),
      ),
    ).toBeEnabled();

    // Ensure other slots aren't able to select either format.
    await expect(
      configurator.getSelectOption(
        select.nth(1),
        outOfPageFormatNames.BOTTOM_ANCHOR(),
      ),
    ).toBeDisabled();
    await expect(
      configurator.getSelectOption(
        select.nth(1),
        outOfPageFormatNames.TOP_ANCHOR(),
      ),
    ).toBeDisabled();
  }

  async function assertIntersitialFormatExclusion(
    configurator: Configurator,
    label: string,
  ) {
    const select = configurator.getSelect(
      label,
      configurator.getConfigSection(SLOT_SETTINGS_TITLE),
    );
    await expect(select).toHaveCount(2);

    // Ensure that slot 1 can select the interstitial format.
    await configurator.selectOption(
      select.first(),
      outOfPageFormatNames.INTERSTITIAL(),
    );

    // Ensure that slot 2 can't select the interstitial format.
    await expect(
      configurator.getSelectOption(
        select.nth(1),
        outOfPageFormatNames.INTERSTITIAL(),
      ),
    ).toBeDisabled();
  }

  async function assertSideRailFormatExclusion(
    configurator: Configurator,
    label: string,
  ) {
    const select = configurator.getSelect(
      label,
      configurator.getConfigSection(SLOT_SETTINGS_TITLE),
    );
    await expect(select).toHaveCount(2);

    // Ensure that slot 1 has access to both side rail formats.
    await configurator.selectOption(
      select.first(),
      outOfPageFormatNames.LEFT_SIDE_RAIL(),
    );
    await expect(
      configurator.getSelectOption(
        select.first(),
        outOfPageFormatNames.RIGHT_SIDE_RAIL(),
      ),
    ).toBeEnabled();

    // Ensure that slot 2 can't select left side rail, but can select right side
    // rail.
    await expect(
      configurator.getSelectOption(
        select.nth(1),
        outOfPageFormatNames.LEFT_SIDE_RAIL(),
      ),
    ).toBeDisabled();
    await expect(
      configurator.getSelectOption(
        select.nth(1),
        outOfPageFormatNames.RIGHT_SIDE_RAIL(),
      ),
    ).toBeEnabled();
    await configurator.selectOption(
      select.nth(1),
      outOfPageFormatNames.RIGHT_SIDE_RAIL(),
    );

    // Ensure that slot 1 now can't select right side rail.
    await expect(
      configurator.getSelectOption(
        select.first(),
        outOfPageFormatNames.RIGHT_SIDE_RAIL(),
      ),
    ).toBeDisabled();
  }

  test('Ad format select: only 1 anchor format can be selected', async ({
    configurator,
  }) => {
    await assertAnchorFormatExclusion(configurator, FORMAT_SELECT_LABEL);
  });

  test('Template select: only 1 anchor format can be selected', async ({
    configurator,
  }) => {
    await assertAnchorFormatExclusion(configurator, TEMPLATE_SELECT_LABEL);
  });

  test('Ad format select: only 1 interstitial format ad can be selected', async ({
    configurator,
  }) => {
    await assertIntersitialFormatExclusion(configurator, FORMAT_SELECT_LABEL);
  });

  test('Template select: only 1 interstitial format ad can be selected', async ({
    configurator,
  }) => {
    await assertIntersitialFormatExclusion(configurator, TEMPLATE_SELECT_LABEL);
  });

  test('Ad format select: only 1 of each side rail format can be selected', async ({
    configurator,
  }) => {
    await assertSideRailFormatExclusion(configurator, FORMAT_SELECT_LABEL);
  });

  test('Template select: only 1 of each side rail format can be selected', async ({
    configurator,
  }) => {
    await assertSideRailFormatExclusion(configurator, TEMPLATE_SELECT_LABEL);
  });
});

test.describe('Interstitial settings', () => {
  /**
   * Maps interstitial setting labels to the config properties they
   * control and the {@link googletag.config.InterstitialConfig} necessary
   * to enable them.
   */
  const booleanSettings: {
    label: string;
    expectedText: string;
    setting: googletag.config.InterstitialConfig;
  }[] = [
    {
      label: interstitialConfigNames.requireStorageAccess(),
      expectedText: 'requireStorageAccess',
      setting: {requireStorageAccess: true},
    },
    {
      label: interstitialTriggerNames.navBar(),
      expectedText: 'navBar',
      setting: {triggers: {navBar: true}},
    },
    {
      label: interstitialTriggerNames.unhideWindow(),
      expectedText: 'unhideWindow',
      setting: {triggers: {unhideWindow: true}},
    },
  ];

  const interstitialSlotConfig: SampleSlotConfig = {
    adUnit: '/123/Test',
    format: 'INTERSTITIAL',
    size: [],
  };

  booleanSettings.forEach(({label, expectedText, setting}) => {
    test.describe('Enable/disable checkboxes', () => {
      // Load the configurator with interstitial config settings visible.
      test.use({config: {slots: [interstitialSlotConfig]}});

      test(`${label} adds ${expectedText}`, async ({configurator, page}) => {
        const checkbox = configurator.getCheckbox(
          label,
          configurator.getConfigSection(configNames.slots()),
        );

        // Enable the setting and ensure expected string appears in code.
        await checkbox.check();
        await expect(page.locator('gpt-playground')).toContainText(
          expectedText,
        );

        // Disable the setting and ensure expected string no longer appears in
        // code.
        await checkbox.uncheck();
        await expect(page.locator('gpt-playground')).not.toContainText(
          expectedText,
        );
      });
    });

    test.describe('Prepopulation', () => {
      // Load the configurator with a SampleConfig that enables the property
      // under test.
      test.use({
        config: {
          slots: [{...interstitialSlotConfig, config: {interstitial: setting}}],
        },
      });

      test(`${label} adds ${expectedText}`, async ({configurator, page}) => {
        await expect(
          configurator.getCheckbox(
            label,
            configurator.getConfigSection(configNames.slots()),
          ),
        ).toBeChecked();
        await expect(page.locator('gpt-playground')).toContainText(
          expectedText,
        );
      });
    });
  });
});
