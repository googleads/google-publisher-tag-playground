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

import {SampleConfig} from '../../src/model/sample-config.js';

import {ChipInput, expect, test} from './fixtures/configurator.js';

const EMPTY_CUSTOM_SLOT: SampleConfig = {
  slots: [
    {
      adUnit: '/123/test',
      size: [],
    },
  ],
};

// Initialize the ChipInput locator before running tests.
let input: ChipInput;
test.beforeEach('Get slot size input', async ({configurator}) => {
  input = configurator.getChipInput('Slot settings', 'Sizes');
});

test.describe('Add size(s)', () => {
  test.use({config: EMPTY_CUSTOM_SLOT});

  test('Adding valid size creates chip', async () => {
    await input.addValue('100x100');
    await expect(input.getChip('100x100')).toBeVisible();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Adding invalid size does not create chip', async () => {
    await input.addValue('-1x100');
    await expect(input.getChip('-1x100')).not.toBeVisible();
    await expect(input.getValidationError()).toBeVisible();
  });

  [' ', ','].forEach(delimiter => {
    test(`Pressing '${delimiter}' adds sizes`, async () => {
      const textField = input.getTextField();
      await textField.fill('100x100');
      await textField.press(delimiter);
      await expect(textField).toBeEmpty();
      await expect(input.getChip('100x100')).toBeVisible();
    });

    test(`'${delimiter}' delimited string creates multiple sizes`, async () => {
      await input.addValue(`100x100${delimiter}200x200`);
      await expect(input.getTextField()).toBeEmpty();
      await expect(input.getChip('100x100')).toBeVisible();
      await expect(input.getChip('200x200')).toBeVisible();
    });
  });
});

test.describe('Delete size(s)', () => {
  test.use({config: EMPTY_CUSTOM_SLOT});

  test('Clicking delete removes chip', async () => {
    await input.addValue('100x100');
    await input.deleteValue('100x100');
    await expect(input.getChip('100x100')).not.toBeVisible();
    await expect(input.getTextField()).toBeEmpty();
  });
});

test.describe('Edit size(s)', () => {
  test.use({config: EMPTY_CUSTOM_SLOT});

  test('Clicking chip returns size to text field', async () => {
    await input.addValue('100x100');
    await input.editValue('100x100');
    await expect(input.getChip('100x100')).not.toBeVisible();
    await expect(input.getTextField()).toHaveValue('100x100');
  });

  test('Clicking chip appends size to existing value', async () => {
    await input.addValue('100x100');
    await input.getTextField().fill('200x200');
    await input.editValue('100x100');
    expect(await input.getTextField().inputValue()).toContain('100x100');
    expect(await input.getTextField().inputValue()).toContain('200x200');
  });

  test('Can recreate sizes from appended values', async () => {
    // Add 2 sizes.
    await input.addValue('100x100');
    await input.addValue('200x200');

    // Click both sizes to return them to the text field.
    await input.editValue('100x100');
    await input.editValue('200x200');

    // Ensure the contents of the input can be used to recreate both sizes.
    await input.getTextField().press('Enter');
    await expect(input.getChip('100x100')).toBeVisible();
    await expect(input.getChip('200x200')).toBeVisible();
  });
});

test.describe('Validation', () => {
  test.use({config: EMPTY_CUSTOM_SLOT});

  test('Dimensions up to 4 digits are valid.', async () => {
    await input.addValue('1x9999');
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Dimensions over 4 digits are invalid', async () => {
    await input.addValue('10000x1');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Negative dimensions are invalid.', async () => {
    await input.addValue('-1x1');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Named size "fluid" is valid.', async () => {
    await input.addValue('fluid');
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Unknown named sizes are invalid', async () => {
    await input.addValue('NotARealSize');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Clearing input clears validation error', async () => {
    await input.addValue('-1x100');
    await expect(input.getValidationError()).toBeVisible();
    await input.getTextField().clear();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Select all + delete clears validation error', async () => {
    await input.addValue('-1x100');
    await expect(input.getValidationError()).toBeVisible();
    await input.getTextField().selectText();
    await input.getTextField().press('Delete');
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Backspacing all characters clears validation error', async () => {
    await input.addValue('-1x100');

    const value = await input.getTextField().inputValue();
    for (let i = 0; i < value.length; i++) {
      await expect(input.getValidationError()).toBeVisible();
      await input.getTextField().press('Backspace');
    }

    await expect(input.getValidationError()).not.toBeVisible();
  });
});
