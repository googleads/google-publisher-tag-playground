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

import '@material/web/slider/slider.js';

import {localized} from '@lit/localize';
import {MdSlider} from '@material/web/slider/slider.js';
import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';

@localized()
@customElement('configurator-slider')
export class ConfiguratorSlider extends LitElement {
  @query('md-slider') input!: MdSlider;

  static styles = css`
    :host {
      display: flex;
      min-width: 200px;
      padding: 8px 0;
      width: 100%;
    }

    label {
      align-items: center;
      display: flex;
      width: 100%;
    }

    md-slider {
      flex-grow: 1;
      padding: 0 8px;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({type: String}) id = `slider-${Date.now().toString()}`;

  /**
   * User-friendly label for the element.
   */
  @property({type: String}) label?: string;

  /**
   * Name content attribute of the element.
   */
  @property({type: String}) name?: string;

  /**
   * The current value of the slider.
   */
  @property({type: Number}) value = 0;

  /**
   * The minimum value of the slider.
   */
  @property({type: Number}) min = 0;

  /**
   * The maximum value of the slider.
   */
  @property({type: Number}) max = 100;

  /**
   * The step value of the slider.
   */
  @property({type: Number}) step = 1;

  /**
   * Whether the slider can be interacted with.
   */
  @property({type: Boolean}) disabled = false;

  /**
   * Whether to show tick marks on the slider.
   */
  @property({type: Boolean}) ticks = false;

  /**
   * Whether to show a label with the current value.
   */
  @property({type: Boolean}) labeled = false;

  private handleChange() {
    this.value = this.input.value ?? 0;

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  render() {
    return html`<label for="${this.id}">
      ${this.label}
      <md-slider
        id="${this.id}"
        name="${ifDefined(this.name)}"
        ?disabled="${this.disabled}"
        ?ticks="${this.ticks}"
        ?labeled="${this.labeled}"
        min="${this.min}"
        max="${this.max}"
        step="${this.step}"
        value="${this.value}"
        @change="${this.handleChange}"
      >
      </md-slider>
    </label>`;
  }
}
