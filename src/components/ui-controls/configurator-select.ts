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

import {localized} from '@lit/localize';
import {css, html, LitElement, TemplateResult} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {when} from 'lit/directives/when.js';

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
  @query('select') selectElement?: HTMLSelectElement;

  static styles = css`
    :host {
      display: flex;
      flex-flow: row wrap;
      width: 100%;
    }

    label {
      min-width: 125px;
      padding: 5px;
      padding-inline-start: 0;
    }

    select {
      flex-grow: 1;
      padding: 5px;
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
      return this.isOptGroup(option) ? option.options : option;
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
  private isOptGroup(x: ConfiguratorSelectOption): x is ConfiguratorOptGroup {
    return (x as ConfiguratorOptGroup).options !== undefined;
  }

  private handleInput() {
    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  /**
   * Renders a single {@link ConfiguratorSelectOption}.
   *
   * @param option The {@link ConfiguratorSelectOption} to render.
   * @returns
   */
  private renderOption(option: ConfiguratorSelectOption): TemplateResult {
    if (this.isOptGroup(option)) {
      return html`
        <optgroup label="${option.label}">
          ${option.options.map(opt => this.renderOption(opt))}
        </optgroup>
      `;
    }

    return html` <option
      ?disabled="${option.disabled}"
      ?selected="${option.selected}"
      value="${ifDefined(option.value)}"
    >
      ${option.label}
    </option>`;
  }

  render() {
    return html`${when(
        this.label,
        () => html`<label for="${this.id}">${this.label}</label>`,
      )}
      <select
        id="${this.id}"
        name="${ifDefined(this.name)}"
        @input=${this.handleInput}
      >
        ${this.internalOptions.map(option => this.renderOption(option))}
      </select>`;
  }
}
