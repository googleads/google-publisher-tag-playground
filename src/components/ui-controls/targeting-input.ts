/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {localized, msg, str} from '@lit/localize';
import {customElement, property} from 'lit/decorators.js';
import {isEqual} from 'lodash-es';

import {ChipInput} from './chip-input.js';

type TargetingKey = string;
type TargetingValue = string | string[] | null;
type TargetingKV = [TargetingKey, TargetingValue];
type TargetingKVRecord = Record<TargetingKey, TargetingValue>;

// Constant UI strings.
const strings = {
  targetingInputLabel: () =>
    msg('Add targeting key-values', {desc: 'Input field title'}),
  targetingInputPlaceholder: () =>
    msg('Key=Value1,Value2,...', {
      desc: 'Valid format for user key-value input',
    }),
  validationErrorDuplicateKey: (key: string) =>
    msg(str`Duplicate key: ${key}`, {desc: 'Validation error'}),
  validationErrorInvalidKey: (key: string) =>
    msg(str`Invalid key: ${key}`, {desc: 'Validation error'}),
  validationErrorInvalidValue: (key: string, value: string) =>
    msg(str`Invalid value for key ${key}: ${value}`, {
      desc: 'Validation error',
    }),
  validationErrorNoValue: (key: string) =>
    msg(str`No value for key: ${key}`, {desc: 'Validation error'}),
};

// Characters invalid for both keys and values.
const INVALID_CHARACTERS = '"\'=!+#\\*~;\\^\\(\\)<>\\[\\],&';

// Key-specific validation:
// 1. Can't start with a number.
// 2. Can't contain any (shared) invalid characters.
// 3. Can't contain spaces.
// 4. Must be <= 20 characters.
const KEY_VALIDATION_PATTERN = `(?!\\d)[^${INVALID_CHARACTERS}\\s]{1,20}`;
const KEY_VALIDATION_REGEX = new RegExp(`^${KEY_VALIDATION_PATTERN}$`);

// Value-specific validation:
// 1. Can't contain any (shared) invalid characters.
// 2. Must be <= 40 characters.
const VALUE_VALIDATION_PATTERN = `[^${INVALID_CHARACTERS}]{1,40}`;
const VALUE_VALIDATION_REGEX = new RegExp(`^${VALUE_VALIDATION_PATTERN}$`);

/**
 * Custom component for displaying/editing GPT targeting key-values.
 */
@localized()
@customElement('targeting-input')
export class TargetingInput extends ChipInput {
  override chips: string[] = [];
  override delimiters: string[] = [';', ' '];

  override chipInputLabel = strings.targetingInputLabel;
  override chipInputPlaceholder = strings.targetingInputPlaceholder;

  /**
   * Set active targeting configuration.
   */
  @property({attribute: 'config', type: Array})
  set config(config: TargetingKVRecord) {
    if (config && !isEqual(this.keyValuestoChips(config), this.chips)) {
      this.chips = this.keyValuestoChips(config);
    }
  }

  /**
   * Get the active targeting configuration.
   */
  get config() {
    return Object.fromEntries(
      this.chips
        .map(chip => this.toKeyValue(chip))
        .filter(kv => !this.validateKeyValue(kv)),
    );
  }

  override validateChip(chip: string): string | null {
    const [key, value] = this.toKeyValue(chip);

    const validationError = this.validateKeyValue([key, value]);
    if (validationError) {
      return validationError;
    } else if (this.chips.some(chip => chip.startsWith(`${key}=`))) {
      return strings.validationErrorDuplicateKey(key);
    }

    return null;
  }

  private validateKeyValue([key, value]: TargetingKV): string | null {
    if (!key || !KEY_VALIDATION_REGEX.test(key)) {
      return strings.validationErrorInvalidKey(key);
    }

    if (!value || value.length === 0) {
      return strings.validationErrorNoValue(key);
    }

    const values = Array.isArray(value) ? value : [value];
    const index = values.findIndex(
      value => !VALUE_VALIDATION_REGEX.test(value),
    );
    if (index > -1) {
      return strings.validationErrorInvalidValue(key, values[index]);
    }

    return null;
  }

  private toChip([key, value]: TargetingKV): string {
    return `${key}=${Array.isArray(value) ? value.join(',') : value}`;
  }

  private toKeyValue(chip: string): TargetingKV {
    const kv = chip.split('=');
    const key = kv[0];
    const value = kv.length === 2 ? kv[1].split(',') : [];

    return [
      key,
      value.length === 0 ? '' : value.length === 1 ? value[0] : value,
    ];
  }

  private keyValuestoChips(keyValues: TargetingKVRecord) {
    return this.sortChips(
      Object.entries(keyValues)
        .filter(kv => !this.validateKeyValue(kv))
        .map(kv => this.toChip(kv)),
    );
  }
}
