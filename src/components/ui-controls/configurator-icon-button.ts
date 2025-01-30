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
@customElement('configurator-icon-button')
export class ConfiguratorIconButton extends LitElement {
  static styles = css`
    :host {
      cursor: pointer;
      direction: ltr;
      display: inline-block;
      font: normal 24px / 1 'Material Icons';
      letter-spacing: normal;
      text-transform: none;
      white-space: nowrap;
      word-wrap: normal;
      -webkit-font-smoothing: antialiased;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({type: String}) id = `checkbox-${Date.now().toString()}`;

  /**
   * The material icon to be displayed.
   *
   * Must be a valid icon name from {@link https://fonts.google.com/icons}.
   */
  @property({type: String}) icon = '';

  /**
   * User-friendly title for the element.
   */
  @property({type: String}) title = '';

  /**
   * Name content attribute of the element.
   */
  @property({type: String}) name?: string;

  render() {
    return html`<span
      id="${this.id}"
      name="${ifDefined(this.name)}"
      title="${this.title}"
    >
      ${this.icon}
    </span>`;
  }
}
