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

import '@material/web/select/filled-select';
import '@material/web/select/select-option';

import {localized} from '@lit/localize';
import {MdFilledSelect} from '@material/web/select/filled-select.js';
import {css, html, LitElement, TemplateResult} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {when} from 'lit/directives/when.js';

/**
 * Whether menu animations are enabled.
 *
 * Menu animations don't seem to play nice with disabled elements
 * at present, so keeping this disabled for now.
 */
const MENU_ANIMATION_ENABLED = false;

/**
 * The number of spaces to indent options nested under an opt group.
 */
const OPT_GROUP_INDENT = 2;

/**
 * Describes an `<option>` element.
 */
export interface ConfiguratorOption {
  label: string;
  disabled?: boolean;
  selected?: boolean;
  value?: string;
}

/**
 * Describes an `<optgroup>` element.
 */
export interface ConfiguratorOptGroup {
  label: string;
  options: ConfiguratorOption[];
}

/**
 * A valid `<select>` option.
 */
export type ConfiguratorSelectOption =
  | ConfiguratorOption
  | ConfiguratorOptGroup;

@localized()
@customElement('configurator-select')
export class ConfiguratorSelect extends LitElement {
  @query('md-filled-select') selectElement?: MdFilledSelect;

  static styles = css`
    :host {
      display: flex;
      flex-flow: row wrap;
      width: 100%;
    }

    md-filled-select {
      padding: 0 0 8px;
      width: 100%;

      --md-filled-field-leading-space: 10px;
      --md-filled-field-top-space: calc(0.75rem - 2px);
      --md-filled-field-trailing-space: 10px;
      --md-filled-field-with-label-bottom-space: 4px;
      --md-filled-field-with-label-top-space: 2px;
    }

    md-select-option {
      --md-menu-item-bottom-space: 0;
      --md-menu-item-leading-space: 10px;
      --md-menu-item-one-line-container-height: 46px;
      --md-menu-item-top-space: 0;
      --md-menu-item-trailing-space: 10px;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({type: String})
  id = `select-${Date.now().toString()}`;

  /**
   * User-friendly label for the element.
   */
  @property({type: String})
  label?: string;

  /**
   * Name content attribute of the element.
   */
  @property({type: String})
  name?: string;

  private internalOptions: ConfiguratorSelectOption[] = [];

  /**
   * Array of {@link ConfiguratorSelectOption} elements
   * representing the options of this element.
   */
  @property({type: Array})
  get options(): ConfiguratorSelectOption[] {
    return this.internalOptions;
  }

  set options(options: ConfiguratorSelectOption[]) {
    this.internalOptions = options;
  }

  /**
   * Returns the set of currently selected options.
   *
   * Note: {@link ConfiguratorSelect} only supports single select, so
   * this method will never return more than 1 option element.
   */
  get selectedOptions(): ConfiguratorOption[] {
    const options = this.internalOptions.flatMap(option => {
      return this.isOptGroup(option) ? [option, ...option.options] : option;
    });

    // Order of precedence:
    //
    // 1. If the select is rendered and has a value, use that.
    // 2. If not, look for a selected option in the array of options passed in.
    // 3. If all else fails, return the first option.
    return [
      this.selectElement && this.selectElement.selectedIndex > -1
        ? options[this.selectElement.selectedIndex]
        : (options.find(
            option => !this.isOptGroup(option) && option.selected,
          ) ?? options[0]),
    ];
  }

  /**
   * Returns the currently selected option value.
   */
  get value() {
    return this.selectedOptions[0].value;
  }

  /**
   * Type guard to distinguish OptGroups from Options.
   */
  protected isOptGroup(x: ConfiguratorSelectOption): x is ConfiguratorOptGroup {
    return (x as ConfiguratorOptGroup).options !== undefined;
  }

  protected handleInput() {
    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  /**
   * Renders a single {@link ConfiguratorSelectOption}.
   *
   * @param option The {@link ConfiguratorSelectOption} to render.
   * @param nested Whether the option to be rendered is a member of an opt
   *     group.
   * @returns
   */
  protected renderOption(
    option: ConfiguratorSelectOption,
    nested = false,
  ): TemplateResult {
    if (this.isOptGroup(option)) {
      // MdSelect doesn't support opt groups. Emulate this behavior by rendering
      // a disabled option, then manually indenting all nested options.
      return html`
        <md-select-option disabled>
          <div slot="headline">${option.label}</div>
        </md-select-option>
        ${option.options.map(opt => this.renderOption(opt, true))}
      `;
    }

    return html`<md-select-option
      ?disabled="${option.disabled}"
      ?selected="${option.selected}"
      value="${ifDefined(option.value)}"
    >
      <div slot="headline">
        ${when(nested, () =>
          Array<TemplateResult>(OPT_GROUP_INDENT).fill(html`&nbsp;`),
        )}${option.label}
      </div>
    </md-select-option>`;
  }

  render() {
    return html`<md-filled-select
      id="${this.id}"
      label="${ifDefined(this.label)}"
      name="${ifDefined(this.name)}"
      ?quick="${!MENU_ANIMATION_ENABLED}"
      .displayText="${this.selectedOptions[0].label}"
      @input=${this.handleInput}
    >
      ${this.internalOptions.map(option => this.renderOption(option))}
    </md-filled-select>`;
  }
}
