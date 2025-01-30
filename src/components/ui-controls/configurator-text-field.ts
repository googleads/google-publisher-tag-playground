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
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';
import {when} from 'lit/directives/when.js';

@localized()
@customElement('configurator-text-field')
export class ConfiguratorTextField extends LitElement {
  @query('input') input?: HTMLInputElement;

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

    input {
      flex-grow: 1;
      padding: 5px;
    }

    input:invalid {
      background-color: lightpink;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({attribute: 'id', type: String})
  id = `text-field-${Date.now().toString()}`;

  /**
   * User-friendly label for the element.
   */
  @property({attribute: 'label', type: String}) label?: string;

  /**
   * Name content attribute of the element.
   */
  @property({attribute: 'name', type: String}) name?: string;

  /**
   * Pattern content attribute of the element.
   */
  @property({attribute: 'pattern', type: String}) pattern?: string;

  private internalValue = '';

  /**
   * Current value of the element.
   */
  @property({attribute: 'value', type: String})
  get value() {
    return this.internalValue;
  }

  set value(value: string) {
    this.internalValue = value;
    if (this.input) this.input.value = this.internalValue;
  }

  private handleInput() {
    this.internalValue = this.input!.value;

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  render() {
    return html`${when(
        this.label,
        () => html`<label for="${this.id}">${this.label}</label>`,
      )}
      <input
        type="text"
        id="${this.id}"
        name="${ifDefined(this.name)}"
        pattern="${ifDefined(this.pattern)}"
        value="${this.internalValue}"
        @input="${this.handleInput}"
      />`;
  }
}
