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

import '@material/web/switch/switch';

import {localized} from '@lit/localize';
import {MdSwitch} from '@material/web/switch/switch.js';
import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';

@localized()
@customElement('configurator-checkbox')
export class ConfiguratorCheckbox extends LitElement {
  @query('md-switch') input!: MdSwitch;

  static styles = css`
    :host {
      display: flex;
      min-width: 200px;
      padding: 8px 0;
      width: 50%;

      --md-switch-track-height: 24px;
      --md-switch-track-width: 36px;
      --md-switch-selected-handle-height: 18px;
      --md-switch-selected-handle-width: 18px;
    }

    label {
      align-items: center;
      display: flex;
    }

    md-switch {
      padding: 0 8px;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({type: String}) id = `checkbox-${Date.now().toString()}`;

  /**
   * User-friendly label for the element.
   */
  @property({type: String}) label?: string;

  /**
   * Name content attribute of the element.
   */
  @property({type: String}) name?: string;

  /**
   * Whether the checkbox is currently selected.
   */
  @property({type: Boolean}) checked = false;

  /**
   * Whether the checkbox can be interacted with.
   */
  @property({type: Boolean}) disabled = false;

  private handleClick() {
    this.checked = this.input.selected;

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  render() {
    return html`<label for="${this.id}">
      <md-switch
        id="${this.id}"
        name="${ifDefined(this.name)}"
        ?disabled="${this.disabled}"
        ?selected="${this.checked}"
        @change="${this.handleClick}"
      >
      </md-switch>
      ${this.label}
    </label>`;
  }
}
