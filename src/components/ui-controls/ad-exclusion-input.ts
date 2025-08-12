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

import {localized, msg} from '@lit/localize';
import {customElement, property} from 'lit/decorators.js';

import {ChipInput} from './chip-input.js';

// Constant UI strings.
const strings = {
  adExclusionInputLabel: () =>
    msg('Add an ad exclusion label', {desc: 'Input field title'}),
  validationErrorLength: () =>
    msg('Labels must be 127 characters or less', {desc: 'Validation error'}),
};

/**
 * Custom component for displaying/editing GPT ad exclusion labels.
 */
@localized()
@customElement('ad-exclusion-input')
export class AdExclusionInput extends ChipInput {
  protected chips: string[] = [];

  // Labels techically have no character restrictions, but we'll reserve a
  // few characters as delimiters just to make the control easier to use.
  protected delimiters: string[] = [',', ';'];

  protected chipInputLabel = strings.adExclusionInputLabel;

  // Labels have no specific format, so leave the placeholder blank.
  protected chipInputPlaceholder = () => '';

  /**
   * Set active ad exclusion labels.
   */
  @property({attribute: 'config', type: Array})
  set config(config: string[]) {
    this.chips = config;
  }

  /**
   * Get the active ad exclusion labels.
   */
  get config() {
    return this.chips;
  }

  protected validateChip(chip: string): string | null {
    return chip.length <= 127 ? '' : strings.validationErrorLength();
  }
}
