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
import {classMap} from 'lit/directives/class-map.js';

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

      --config-section-spacing: 8px;
    }

    .wrapper {
      display: flex;
      flex: 1 1 100%;
      flex-flow: row wrap;
      min-width: 0;
      width: 100%;
    }

    .closed .wrapper {
      display: none;
    }

    fieldset {
      background-color: var(--md-sys-color-surface-container);
      border: 1px solid var(--md-sys-color-outline);
      color: var(--md-sys-color-on-surface);
      display: flex;
      flex-flow: row wrap;
      margin: var(--config-section-spacing) var(--config-section-spacing)
        calc(var(--config-section-spacing) * 2);
      min-width: 0;
      padding: var(--config-section-spacing);
      width: 100%;
    }

    fieldset.nested {
      background-color: var(--md-sys-color-surface-container-high);
      margin: 0 0 var(--config-section-spacing);
    }

    legend {
      align-items: center;
      background-color: var(--md-sys-color-primary);
      border: 1px solid var(--md-sys-color-on-surface);
      border-radius: 5px;
      color: var(--md-sys-color-on-primary);
      cursor: pointer;
      display: flex;
      font: var(--title-font);
      padding: calc(var(--config-section-spacing) / 2)
        calc(var(--config-section-spacing) * 2);
      padding-inline-start: var(--config-section-spacing);
    }

    .nested legend {
      background-color: var(--md-sys-color-secondary);
      color: var(--md-sys-color-on-secondary);
    }

    legend::before {
      font-family: 'Material Icons';
      content: 'arrow_drop_down';
      display: inline-block;
    }

    .closed legend::before {
      content: 'arrow_right';
    }
  `;

  /**
   * Whether the section is expanded or collapsed.
   */
  @property({attribute: 'closed', type: Boolean}) closed = false;

  /**
   * The name of the section.
   */
  @property({attribute: 'title', type: String}) title = '';

  /**
   * Whether the section is displayed within another section.
   * This affects the styling of the section.
   */
  @property({attribute: 'nested', type: Boolean}) nested = false;

  /**
   * Expand or collapse the section, depending on it's current state.
   */
  private toggleSection() {
    this.closed = !this.closed;
  }

  render() {
    return html`
      <fieldset
        class="${classMap({
          closed: this.closed,
          nested: this.nested,
        })}"
      >
        <legend @click="${this.toggleSection}">${this.title}</legend>
        <div class="wrapper">
          <slot></slot>
        </div>
      </fieldset>
    `;
  }
}
