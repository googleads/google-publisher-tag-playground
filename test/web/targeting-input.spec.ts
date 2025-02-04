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

// Initialize the ChipInput locator before running tests.
let input: ChipInput;
test.beforeEach('Get slot size input', async ({configurator}) => {
  input = configurator.getChipInput('Page settings', 'Page-level targeting');
});

test.describe('Add key-value(s)', () => {
  test('Adding valid KV creates chip', async () => {
    await input.addValue('a=a');
    await expect(input.getChip('a=a')).toBeVisible();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Adding invalid KV does not create chip', async () => {
    await input.addValue('a=');
    await expect(input.getChip('a=')).not.toBeVisible();
    await expect(input.getValidationError()).toBeVisible();
  });

  [' ', ';'].forEach(delimiter => {
    test(`Pressing '${delimiter}' adds KVs`, async () => {
      const textField = input.getTextField();
      await textField.fill('a=a');
      await textField.press(delimiter);
      await expect(textField).toBeEmpty();
      await expect(input.getChip('a=a')).toBeVisible();
    });

    test(`'${delimiter}' delimited string creates multiple KVs`, async () => {
      await input.addValue(`a=a${delimiter}b=b`);
      await expect(input.getTextField()).toBeEmpty();
      await expect(input.getChip('a=a')).toBeVisible();
      await expect(input.getChip('b=b')).toBeVisible();
    });
  });
});

test.describe('Delete key-value(s)', () => {
  test('Clicking delete removes chip', async () => {
    await input.addValue('a=a');
    await input.deleteValue('a=a');
    await expect(input.getChip('a=a')).not.toBeVisible();
    await expect(input.getTextField()).toBeEmpty();
  });
});

test.describe('Edit key-value(s)', () => {
  test('Clicking chip returns KV to text field', async () => {
    await input.addValue('a=a');
    await input.editValue('a=a');
    await expect(input.getChip('a=a')).not.toBeVisible();
    await expect(input.getTextField()).toHaveValue('a=a');
  });

  test('Clicking chip appends KV to existing value', async () => {
    await input.addValue('a=a');
    await input.getTextField().fill('b=1,2,3');
    await input.editValue('a=a');
    expect(await input.getTextField().inputValue()).toContain('a=a');
    expect(await input.getTextField().inputValue()).toContain('b=1,2,3');
  });

  test('Can recreate KVs from appended values', async () => {
    // Add 2 sizes.
    await input.addValue('a=a');
    await input.addValue('b=1,2,3');

    // Click both sizes to return them to the text field.
    await input.editValue('a=a');
    await input.editValue('b=1,2,3');

    // Ensure the contents of the input can be used to recreate both sizes.
    await input.getTextField().press('Enter');
    await expect(input.getChip('a=a')).toBeVisible();
    await expect(input.getChip('b=1,2,3')).toBeVisible();
  });
});

test.describe('Validation', () => {
  const invalidChars = '"\'=!+#*~;^()<>[],&';

  test('Valid key-value is valid', async () => {
    await input.addValue('a=a');
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Multile valid values are valid', async () => {
    await input.addValue('a=a,b,c');
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Key starting with a number is invalid.', async () => {
    await input.addValue('1a=a');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Key containing a space is invalid.', async () => {
    await input.addValue('a a=a');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Invalid characters in key are invalid.', async () => {
    for (const char of [...invalidChars]) {
      await input.addValue(`${char}=a`);
      await expect(input.getValidationError()).toBeVisible();
    }
  });

  test('Invalid characters in value are invalid.', async () => {
    for (const char of [...invalidChars]) {
      await input.addValue(`a=${char}`);
      await expect(input.getValidationError()).toBeVisible();
    }
  });

  test('Invalid characters in multi-value KV are invalid.', async () => {
    for (const char of [...invalidChars]) {
      await input.addValue(`a=a,${char},c`);
      await expect(input.getValidationError()).toBeVisible();
    }
  });

  test('Missing key is invalid.', async () => {
    await input.addValue('=a');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Missing value is invalid.', async () => {
    await input.addValue('a=');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Duplicate key is invalid.', async () => {
    await input.addValue('a=a');
    await expect(input.getValidationError()).not.toBeVisible();
    await input.addValue('a=b');
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Keys are limited to 20 characters.', async () => {
    await input.addValue(`${'a'.repeat(20)}=a`);
    await expect(input.getValidationError()).not.toBeVisible();

    await input.addValue(`${'b'.repeat(21)}=b`);
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Values are limited to 40 characters.', async () => {
    await input.addValue(`a=${'a'.repeat(40)}`);
    await expect(input.getValidationError()).not.toBeVisible();

    await input.addValue(`b=${'b'.repeat(41)}`);
    await expect(input.getValidationError()).toBeVisible();
  });

  test('Clearing input clears validation error', async () => {
    await input.addValue(`a=${invalidChars}`);
    await expect(input.getValidationError()).toBeVisible();
    await input.getTextField().clear();
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Select all + delete clears validation error', async () => {
    await input.addValue(`a=${invalidChars}`);
    await expect(input.getValidationError()).toBeVisible();
    await input.getTextField().selectText();
    await input.getTextField().press('Delete');
    await expect(input.getValidationError()).not.toBeVisible();
  });

  test('Backspacing all characters clears validation error', async () => {
    await input.addValue(`a=${invalidChars}`);

    const value = await input.getTextField().inputValue();
    for (let i = 0; i < value.length; i++) {
      await expect(input.getValidationError()).toBeVisible();
      await input.getTextField().press('Backspace');
    }

    await expect(input.getValidationError()).not.toBeVisible();
  });
});
