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
import {css, html, LitElement} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';

@localized()
@customElement('configurator-checkbox')
export class ConfiguratorCheckbox extends LitElement {
  static styles = css`
    :host {
      display: flex;
      width: 33%;
      min-width: 200px;
    }

    input[type='checkbox'] {
      align-self: flex-start;
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

  private handleClick(event: Event) {
    this.checked = (event.target as HTMLInputElement).checked;

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  render() {
    return html`<input
        type="checkbox"
        id="${this.id}"
        name="${ifDefined(this.name)}"
        ?checked="${this.checked}"
        @click="${this.handleClick}"
      />
      <label for="${this.id}">${this.label}</label>`;
  }
}
