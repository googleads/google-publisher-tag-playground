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

import {type Locator} from '@playwright/test';

import {sampleAds} from '../../src/model/sample-ads.js';
import {SampleConfig} from '../../src/model/sample-config.js';
import {
  configNames,
  outOfPageFormatNames,
  safeFrameConfigNames,
} from '../../src/model/settings.js';

import {expect, test} from './fixtures/configurator.js';

const CUSTOM_SLOTS: SampleConfig = {
  slots: [
    {
      adUnit: '/123/test',
      size: [100, 100],
    },
    // Include an OOP ad to disconnect the preview window and speed up loading.
    sampleAds.find(ad => ad.name() === outOfPageFormatNames.INTERSTITIAL())!
      .slot,
  ],
};

test.describe('Inheritable Checkbox', () => {
  test.use({config: CUSTOM_SLOTS});

  let parentCheckbox: Locator;
  let childCheckbox: Locator;

  test.beforeEach(async ({configurator}) => {
    parentCheckbox = configurator.getCheckbox(
      safeFrameConfigNames.forceSafeFrame(),
      configurator.getConfigSection(configNames.page()),
    );
    childCheckbox = configurator.getCheckbox(
      safeFrameConfigNames.forceSafeFrame(),
      configurator.getConfigSection(configNames.slots()),
    );
  });

  test('should be unchecked by default', async () => {
    await expect(parentCheckbox).not.toBeChecked();
    await expect(childCheckbox).not.toBeChecked();
  });

  test('child should inherit from parent', async () => {
    // Turn parent on.
    await parentCheckbox.click({force: true});
    await expect(parentCheckbox).toBeChecked();
    await expect(childCheckbox).toBeChecked();

    // Turn parent off.
    await parentCheckbox.click({force: true});
    await expect(parentCheckbox).not.toBeChecked();
    await expect(childCheckbox).not.toBeChecked();
  });

  test('child should be able to override parent', async () => {
    // Parent is off, turn child on.
    await childCheckbox.click({force: true});
    await expect(parentCheckbox).not.toBeChecked();
    await expect(childCheckbox).toBeChecked();

    // Turn parent on. Child should remain on (inheriting).
    await parentCheckbox.click({force: true});
    await expect(parentCheckbox).toBeChecked();
    await expect(childCheckbox).toBeChecked();

    // Turn child off. Child should be off (overriding).
    await childCheckbox.click({force: true});
    await expect(parentCheckbox).toBeChecked();
    await expect(childCheckbox).not.toBeChecked();
  });

  test('child should return to inheriting when clicked to match parent', async () => {
    await parentCheckbox.click({force: true}); // Parent: ON
    await childCheckbox.click({force: true}); // Child: OFF (override)
    await expect(childCheckbox).not.toBeChecked();

    // Click child to match parent state, should now inherit.
    await childCheckbox.click({force: true}); // Child: ON (inherit)
    await expect(childCheckbox).toBeChecked();

    // Click parent to verify inheritance.
    await parentCheckbox.click({force: true}); // Parent: OFF
    await expect(childCheckbox).not.toBeChecked(); // Child: OFF (inherited)
  });

  test('child should return to inheriting when parent is clicked to match child', async () => {
    // Parent is OFF, turn child ON (override).
    await childCheckbox.click({force: true});
    await expect(childCheckbox).toBeChecked();
    await expect(parentCheckbox).not.toBeChecked();

    // Click parent to match child state. Child should now inherit.
    await parentCheckbox.click({force: true}); // Parent: ON, Child: ON (now inheriting)
    await expect(parentCheckbox).toBeChecked();
    await expect(childCheckbox).toBeChecked();

    // Click parent again to verify inheritance.
    await parentCheckbox.click({force: true}); // Parent: OFF
    await expect(parentCheckbox).not.toBeChecked();
    await expect(childCheckbox).not.toBeChecked(); // Child should follow and be OFF.
  });
});
