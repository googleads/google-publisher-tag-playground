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

import {SampleConfig, SamplePageConfig} from '../../src/model/sample-config.js';
import {
  adSenseAttributesConfigNames,
  collapseDivNames,
  configNames,
  pageSettingsConfigNames,
  privacyConfigNames,
  privacyTreatmentNames,
  safeFrameConfigNames,
} from '../../src/model/settings.js';

import {Configurator, expect, test} from './fixtures/configurator.js';

/**
 * Maps page-level setting labels to the GPT API functions/properties they
 * control and the {@link SamplePageConfig} necessary to enable them.
 */
const BOOLEAN_SETTINGS: {
  label: string;
  expectedText: string;
  setting: SamplePageConfig;
}[] = [
  {
    label: pageSettingsConfigNames.disableInitialLoad(),
    expectedText: 'disableInitialLoad',
    setting: {config: {disableInitialLoad: true}},
  },
  {
    label: pageSettingsConfigNames.singleRequest(),
    expectedText: 'singleRequest',
    setting: {config: {singleRequest: true}},
  },
  {
    label: safeFrameConfigNames.forceSafeFrame(),
    expectedText: 'forceSafeFrame',
    setting: {config: {safeFrame: {forceSafeFrame: true}}},
  },
  {
    label: privacyConfigNames.ltd(),
    expectedText: 'limitedAds',
    setting: {privacy: {ltd: true}},
  },
  {
    label: privacyConfigNames.npa(),
    expectedText: 'nonPersonalizedAds',
    setting: {privacy: {npa: true}},
  },
  {
    label: privacyConfigNames.rdp(),
    expectedText: 'restrictDataProcessing',
    setting: {privacy: {rdp: true}},
  },
  {
    label: privacyConfigNames.tfcd(),
    expectedText: 'childDirectedTreatment',
    setting: {privacy: {tfcd: true}},
  },
  {
    label: privacyConfigNames.tfua(),
    expectedText: 'underAgeOfConsent',
    setting: {privacy: {tfua: true}},
  },
  {
    label: privacyTreatmentNames.disablePersonalization(),
    expectedText: 'disablePersonalization',
    setting: {
      config: {privacyTreatments: {treatments: ['disablePersonalization']}},
    },
  },
];

test.describe('Enable/disable checkboxes', () => {
  BOOLEAN_SETTINGS.forEach(({label, expectedText, setting}) => {
    test(`${label} adds ${expectedText}`, async ({configurator, page}) => {
      const checkbox = configurator.getCheckbox(
        label,
        configurator.getConfigSection('Page settings'),
      );

      // Enable the setting and ensure expected string appears in code.
      await checkbox.check();
      await expect(page.locator('gpt-playground')).toContainText(expectedText);

      // Disable the setting and ensure expected string no longer appears in
      // code.
      await checkbox.uncheck();
      await expect(page.locator('gpt-playground')).not.toContainText(
        expectedText,
      );
    });

    test.describe('Prepopulation', () => {
      const emptyConfig = {
        page: {},
        slots: [],
      } as SampleConfig;

      // Load the configurator with a SampleConfig that enables the property
      // under test.
      test.use({config: {...emptyConfig, page: setting}});

      test(`${label} adds ${expectedText}`, async ({configurator, page}) => {
        await expect(
          configurator.getCheckbox(
            label,
            configurator.getConfigSection('Page settings'),
          ),
        ).toBeChecked();
        await expect(page.locator('gpt-playground')).toContainText(
          expectedText,
        );
      });
    });
  });
});

test.describe('Collapse ad slots', () => {
  Object.entries(collapseDivNames).forEach(([key, label]) => {
    test(`Selecting "${label()}" updates code`, async ({configurator}) => {
      const pageSettings = configurator.getConfigSection(configNames.page());
      const collapseDivSelect = configurator.getSelect(
        pageSettingsConfigNames.collapseDiv(),
        pageSettings,
      );

      await configurator.selectOption(collapseDivSelect, label());
      if (key === 'DISABLED') {
        expect(await configurator.getCodeEditorContents()).not.toContain(
          'collapseDiv',
        );
      } else {
        expect(await configurator.getCodeEditorContents()).toContain(key);
      }
    });

    test.describe('Prepopulation', () => {
      test.use({
        config: {
          page: {
            config: {
              collapseDiv: key as googletag.config.CollapseDivBehavior,
            },
          },
          slots: [],
        },
      });

      test(`Prepopulating "${key}" works as expected`, async ({
        configurator,
      }) => {
        const pageSettings = configurator.getConfigSection(configNames.page());
        const collapseDivSelect = configurator.getSelect(
          pageSettingsConfigNames.collapseDiv(),
          pageSettings,
        );

        await expect(
          configurator.getSelectOption(collapseDivSelect, label()),
        ).toBeSelected();

        expect(await configurator.getCodeEditorContents()).toContain(
          key === 'DISABLED' ? '' : key,
        );
      });
    });
  });
});

test.describe('Configure targeting', () => {
  const testKey = 'test-key';
  const testValue = 'test-value';

  test('Adding/removing KV updates code', async ({configurator, page}) => {
    const targetingInput = configurator.getChipInput(
      'Page settings',
      'Page-level targeting',
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
      'Page settings',
      'Page-level targeting',
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
      'Page settings',
      'Page-level targeting',
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
        page: {config: {targeting: {[testKey]: testValue}}},
        slots: [],
      },
    });

    test('Prepopulated targeting KV appears in code', async ({
      configurator,
      page,
    }) => {
      const targetingInput = configurator.getChipInput(
        'Page settings',
        'Page-level targeting',
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

  test('Adding/removing label updates code', async ({configurator, page}) => {
    const exclusionInput = configurator.getChipInput(
      'Page settings',
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
      'Page settings',
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
      'Page settings',
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
        page: {config: {categoryExclusion: [testLabel]}},
        slots: [],
      },
    });

    test('Prepopulated ad exclusion label appears in code', async ({
      configurator,
      page,
    }) => {
      const exclusionInput = configurator.getChipInput(
        'Page settings',
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

test.describe('Page URL', () => {
  test.describe('Prepopulation', () => {
    const testUrl = 'https://one.two.test.co.uk';

    test.use({
      config: {
        page: {config: {adsenseAttributes: {page_url: testUrl}}},
        slots: [],
      },
    });

    test('Prepopulated page URL appears in code', async ({
      configurator,
      page,
    }) => {
      const pageUrlInput = configurator.getTextField(
        adSenseAttributesConfigNames.page_url(),
        configurator.getConfigSection(configNames.page()),
      );

      await expect(pageUrlInput).toHaveValue(testUrl);
      await expect(page.locator('gpt-playground')).toContainText('page_url');
      await expect(page.locator('gpt-playground')).toContainText(testUrl);
    });
  });

  test.describe('Validation', () => {
    async function validatePageUrl(
      configurator: Configurator,
      url: string,
      shouldBeValid = true,
    ): Promise<void> {
      const pageUrlInput = configurator.getTextField(
        adSenseAttributesConfigNames.page_url(),
        configurator.getConfigSection(configNames.page()),
      );
      await pageUrlInput.fill(url);

      return shouldBeValid
        ? expect(pageUrlInput).toBeValid()
        : expect(pageUrlInput).not.toBeValid();
    }

    test('Protocol is required', async ({configurator}) => {
      await validatePageUrl(configurator, 'www.google.com', false);
      await validatePageUrl(configurator, 'https://www.google.com');
    });

    test('Unsupported protocols are invalid', async ({configurator}) => {
      await validatePageUrl(configurator, 'file://file.txt', false);
      await validatePageUrl(configurator, 'ftp://1270.0.0.1', false);
      await validatePageUrl(configurator, 'javascript:alert("")', false);
    });

    test('Subdomain is optional', async ({configurator}) => {
      await validatePageUrl(configurator, 'https://google.com');
    });

    test('Multiple subdomains are supported', async ({configurator}) => {
      await validatePageUrl(configurator, 'https://one.two.google.com');
    });

    test('Top-level domain is required', async ({configurator}) => {
      await validatePageUrl(configurator, 'https://google', false);
      await validatePageUrl(configurator, 'https://google.com');
    });

    test('Second-level domains are supported', async ({configurator}) => {
      await validatePageUrl(configurator, 'https://www.google.co.uk');
    });

    test('Paths are supported', async ({configurator}) => {
      await validatePageUrl(configurator, 'https://www.google.com/one/two');
    });
  });
});
