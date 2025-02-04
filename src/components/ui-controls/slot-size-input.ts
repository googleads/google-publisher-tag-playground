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

import '@material/web/chips/chip-set';
import '@material/web/chips/input-chip';
import '@material/web/textfield/filled-text-field';

import {localized, msg, str} from '@lit/localize';
import {customElement, property} from 'lit/decorators.js';
import {isEqual} from 'lodash-es';

import {ChipInput} from './chip-input.js';

// Constant UI strings.
const strings = {
  slotSizeInputPlaceholder: () =>
    msg('100x100,fluid,...', {desc: 'Valid formats for user size input'}),
  slotSizeInputLabel: () => msg('Ad slot sizes', {desc: 'Input field label'}),
  validationErrorInvalidSize: (size: string) =>
    msg(str`Invalid size: ${size}`, {
      desc: 'Validation error',
    }),
};

// Height and width validation patterns.
const DIMENSION_PAIR_VALIDATION_REGEX = new RegExp('^[\\d]{1,4}x[\\d]{1,4}$');

/**
 * Custom component for displaying/editing GPT slot sizes.
 */
@localized()
@customElement('slot-size-input')
export class SlotSizeInput extends ChipInput {
  override chips: string[] = [];
  override delimiters: string[] = [',', ' '];

  override chipInputLabel = strings.slotSizeInputLabel;
  override chipInputPlaceholder = strings.slotSizeInputPlaceholder;

  /**
   * Set the active slot size config.
   */
  @property({attribute: 'config', type: Array})
  set config(config: googletag.GeneralSize) {
    if (config && !isEqual(this.sizesToChips(config), this.chips)) {
      this.chips = this.sizesToChips(config);
    }
  }

  /**
   * Get the active slot size config.
   */
  get config() {
    const sizes = this.chipsToSizes();
    return sizes.length === 1 ? sizes[0] : Array.from(sizes);
  }

  override sortChips(chips: string[]): string[] {
    return this.sortSizes(this.chipsToSizes(chips)).map(size =>
      this.toChip(size),
    );
  }

  override validateChip(chip: string): string | null {
    return this.toSingleSize(chip)
      ? ''
      : strings.validationErrorInvalidSize(chip);
  }

  private sortSizes(sizes: googletag.SingleSize[]) {
    // Sort sizes such that NamedSizes appear first, followed by naturally
    // ordered SingleSizes.
    return sizes.sort((a, b) => {
      if (this.isNamedSize(a)) return -1;
      if (this.isNamedSize(b)) return 1;
      return a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1];
    });
  }

  private chipsToSizes(chips: string[] = this.chips): googletag.SingleSize[] {
    return chips.map(chip => this.toSingleSize(chip)).filter(chip => !!chip);
  }

  private sizesToChips(sizes: googletag.GeneralSize) {
    let cleanedSizes: googletag.SingleSize[];

    // Convert SingleSize -> MultiSize to simplify iteration.
    if (Array.isArray(sizes)) {
      if (sizes.length === 0) {
        cleanedSizes = [];
      } else if (sizes.length === 1 && this.isNamedSize(sizes[0])) {
        // ['fluid'] -> [['fluid']]
        cleanedSizes = [sizes] as googletag.MultiSize;
      } else if (sizes.length === 2 && Number.isInteger(sizes[0])) {
        // [100, 200] -> [[100, 200]]
        cleanedSizes = [sizes] as googletag.MultiSize;
      } else {
        cleanedSizes = sizes as googletag.MultiSize;
      }
    } else {
      // 'fluid' -> [['fluid']]
      cleanedSizes = [[sizes]];
    }

    return this.sortSizes(cleanedSizes).map(size => this.toChip(size));
  }

  /**
   * Type guard to distinguish NamedSize from SingleSize.
   */
  private isNamedSize(size: googletag.SingleSize): size is googletag.NamedSize {
    const namedSizes = ['fluid'];
    return Array.isArray(size)
      ? size.length === 1 && namedSizes.includes(String(size[0]))
      : namedSizes.includes(size);
  }

  private toSingleSize(sizeString: string) {
    if (this.isNamedSize(sizeString as googletag.SingleSize)) {
      return sizeString as googletag.NamedSize;
    } else if (DIMENSION_PAIR_VALIDATION_REGEX.test(sizeString)) {
      return sizeString
        .split('x')
        .map(dimension => Number(dimension)) as googletag.SingleSizeArray;
    }
  }

  private toChip(size: googletag.SingleSize) {
    return this.isNamedSize(size)
      ? Array.isArray(size)
        ? (size as googletag.NamedSize)[0]
        : size
      : (size as googletag.SingleSizeArray).join('x');
  }
}
