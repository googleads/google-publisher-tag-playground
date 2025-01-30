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

/**
 * A named grouping of configuration settings.
 */
@localized()
@customElement('config-section')
export class ConfigSection extends LitElement {
  static styles = css`
    :host {
      display: flex;
      min-width: 0;
      width: 100%;
    }

    fieldset {
      display: flex;
      flex-flow: row wrap;
      min-width: 0;
      width: 100%;
    }

    ::slotted(config-section),
    ::slotted(targeting-input) {
      margin: 15px 0 0;
    }
  `;

  /**
   * The name of the section.
   */
  @property({attribute: 'title', type: String}) title = '';

  render() {
    return html`
      <fieldset>
        <legend>${this.title}</legend>
        <slot></slot>
      </fieldset>
    `;
  }
}
