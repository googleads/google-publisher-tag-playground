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
import {
  ConfiguratorOptGroup,
  ConfiguratorOption,
  ConfiguratorSelect,
} from './configurator-select.js';
import {signal, SignalWatcher} from '@lit-labs/signals';
import {TemplateResult} from 'lit';
import {isEqual} from 'lodash-es';

const ANCHOR_FORMATS: OutOfPageFormat[] = ['BOTTOM_ANCHOR', 'TOP_ANCHOR'];

// A Signal used to coordinate enabling/disabling of ad format
// options across all instances of this class.
const SELECTED_FORMATS = signal<OutOfPageFormat[]>([]);

/**
 * Describes ad format aware `<option>` element.
 */
export interface ConfiguratorFormatOption extends ConfiguratorOption {
  format?: OutOfPageFormat;
}

/**
 * Describes ad format aware `<optgroup>` element.
 */
export interface ConfiguratorFormatOptGroup extends ConfiguratorOptGroup {
  options: ConfiguratorFormatOption[];
}

/**
 * A valid ad format aware `<select>` option.
 */
export type ConfiguratorFormatSelectOption =
  | ConfiguratorFormatOption
  | ConfiguratorFormatOptGroup;

type OutOfPageFormat = keyof typeof googletag.enums.OutOfPageFormat;

// Constant UI strings.
const strings = {
  formatDisabled: () =>
    msg('Unavailable', {
      desc: 'Text shown when a drop-down option is disabled.',
    }),
};

@localized()
@customElement('configurator-format-select')
export class ConfiguratorFormatSelect extends SignalWatcher(
  ConfiguratorSelect,
) {
  private selectedFormat?: OutOfPageFormat;

  /**
   * The currently selected ad format.
   */
  @property({type: String})
  get format() {
    return this.selectedFormat;
  }

  /**
   * Array of {@link ConfiguratorFormatSelectOption} elements
   * representing the options of this element.
   */
  @property({type: Array})
  override set options(options: ConfiguratorFormatSelectOption[]) {
    super.options = options;

    // Find the format associated with the currently selected option.
    const selectedFormat = (this.selectedOptions[0] as ConfiguratorFormatOption)
      .format;

    this.registerSelectedFormat(selectedFormat);
  }

  /**
   * Notifies all isntances of this class about any changes to selected formats.
   */
  private registerSelectedFormat(format: OutOfPageFormat | undefined) {
    const formats = SELECTED_FORMATS.get();

    // Remove the previously selected format, if there was one.
    if (this.selectedFormat && formats.includes(this.selectedFormat)) {
      formats.splice(formats.indexOf(this.selectedFormat));
    }

    // Record the newly selected format, if there is one.
    this.selectedFormat = format;
    if (this.selectedFormat) formats.push(this.selectedFormat);

    // Update the signal if anything changed.
    if (!isEqual(formats, SELECTED_FORMATS.get())) {
      SELECTED_FORMATS.set(formats);
    }
  }

  /**
   * Determines whether the specified format is disabled for the current select.
   */
  private isFormatDisabled(format: OutOfPageFormat | undefined) {
    // An option with no associated format can never be auto disabled.
    if (!format) return false;

    if (ANCHOR_FORMATS.includes(format)) {
      // If slot is an anchor, allow swapping between top and bottom formats.
      // Otherwise, disable both if either is selected elsewhere.
      return (
        SELECTED_FORMATS.get().some(format =>
          ANCHOR_FORMATS.includes(format),
        ) &&
        (!this.selectedFormat || !ANCHOR_FORMATS.includes(this.selectedFormat))
      );
    }

    return (
      SELECTED_FORMATS.get().includes(format) && this.selectedFormat !== format
    );
  }

  override handleInput() {
    const option = this.selectedOptions[0] as ConfiguratorFormatOption;
    this.registerSelectedFormat(option.format);

    super.handleInput();
  }

  override renderOption(
    option: ConfiguratorFormatSelectOption,
  ): TemplateResult {
    if (this.isOptGroup(option)) return super.renderOption(option);

    const formatDisabled = this.isFormatDisabled(option.format);
    return super.renderOption({
      ...option,
      disabled: option.disabled || formatDisabled,
      label: `${option.label}${formatDisabled ? ` (${strings.formatDisabled()})` : ''}`,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Unregiser any format associated with this component when it's destroyed.
    this.registerSelectedFormat(undefined);
  }
}
