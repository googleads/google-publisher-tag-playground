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

import {ChipInput, expect, test} from './fixtures/configurator.js';

const MAX_CHARS = 127;

// Initialize the ChipInput locator before running tests.
let input: ChipInput;
test.beforeEach('Get ad exclusion input', async ({configurator}) => {
  input = configurator.getChipInput('Page settings', 'Ad exclusion labels');
});

test.describe('Add label(s)', () => {
  test('Adding valid label creates chip', async () => {
    await input.addValue('test-label');
    await expect(input.getChip('test-label')).toBeVisible();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Adding invalid label does not create chip', async () => {
    const invalidLabel = 'a'.repeat(MAX_CHARS + 1);
    await input.addValue(invalidLabel);
    await expect(input.getChip(invalidLabel)).not.toBeVisible();
    await expect(input.getValidationError()).toBeVisible();
  });

  [',', ';'].forEach(delimiter => {
    test(`Pressing '${delimiter}' adds labels`, async () => {
      const textField = input.getTextField();
      await textField.fill('label1');
      await textField.press(delimiter);
      await expect(textField).toBeEmpty();
      await expect(input.getChip('label1')).toBeVisible();
    });

    test(`'${delimiter}' delimited string creates multiple labels`, async () => {
      await input.addValue(`label1${delimiter}label2`);
      await expect(input.getTextField()).toBeEmpty();
      await expect(input.getChip('label1')).toBeVisible();
      await expect(input.getChip('label2')).toBeVisible();
    });
  });
});

test.describe('Delete label(s)', () => {
  test('Clicking delete removes chip', async () => {
    await input.addValue('test-label');
    await input.deleteValue('test-label');
    await expect(input.getChip('test-label')).not.toBeVisible();
    await expect(input.getTextField()).toBeEmpty();
  });
});

test.describe('Edit label(s)', () => {
  test('Clicking chip returns label to text field', async () => {
    await input.addValue('test-label');
    await input.editValue('test-label');
    await expect(input.getChip('test-label')).not.toBeVisible();
    await expect(input.getTextField()).toHaveValue('test-label');
  });

  test('Clicking chip appends label to existing value', async () => {
    await input.addValue('label1');
    await input.getTextField().fill('label2');
    await input.editValue('label1');
    expect(await input.getTextField().inputValue()).toContain('label1');
    expect(await input.getTextField().inputValue()).toContain('label2');
  });

  test('Can recreate labels from appended values', async () => {
    // Add 2 labels.
    await input.addValue('label1');
    await input.addValue('label2');

    // Click both labels to return them to the text field.
    await input.editValue('label1');
    await input.editValue('label2');

    // Ensure the contents of the input can be used to recreate both labels.
    await input.getTextField().press('Enter');
    await expect(input.getChip('label1')).toBeVisible();
    await expect(input.getChip('label2')).toBeVisible();
  });
});

test.describe('Validation', () => {
  test('Label up to 127 characters is valid', async () => {
    const validLabel = 'a'.repeat(MAX_CHARS);
    await input.addValue(validLabel);
    await expect(input.getChip(validLabel)).toBeVisible();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Label over 127 characters is invalid', async () => {
    const invalidLabel = 'a'.repeat(MAX_CHARS + 1);
    await input.addValue(invalidLabel);
    await expect(input.getChip(invalidLabel)).not.toBeVisible();
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Clearing input clears validation error', async () => {
    const invalidLabel = 'a'.repeat(MAX_CHARS + 1);
    await input.addValue(invalidLabel);
    await expect(input.getValidationError()).toBeVisible();
    await input.getTextField().clear();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Select all + delete clears validation error', async () => {
    const invalidLabel = 'a'.repeat(MAX_CHARS + 1);
    await input.addValue(invalidLabel);
    await expect(input.getValidationError()).toBeVisible();
    await input.getTextField().selectText();
    await input.getTextField().press('Delete');
    await expect(input.getValidationError()).not.toBeVisible();
  });
});
