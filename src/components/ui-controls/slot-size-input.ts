/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {localized, msg} from '@lit/localize';
import {css, html, LitElement, nothing, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {keyed} from 'lit/directives/keyed.js';
import {isEqual} from 'lodash-es';

import {materialIcons} from '../styles/material-icons.js';

// Constant UI strings.
const strings = {
  addSizeTitle: () => msg('Add size', {desc: 'Button title'}),
  fluidLabel: () => msg('Fluid', {desc: 'The "fluid" size for native ads.'}),
  heightPlaceholder: () => msg('Height', {desc: 'Placeholder text'}),
  removeSizeTitle: () => msg('Remove size', {desc: 'Button title'}),
  widthPlaceholder: () => msg('Width', {desc: 'Placeholder text'}),
};

// Height and width validation patterns.
const DIMENSION_VALIDATION_PATTERN = '[\\d]{1,4}';
const DIMENSION_VALIDATION_REGEX = new RegExp(
  `^${DIMENSION_VALIDATION_PATTERN}$`,
);

/**
 * Custom wrapper around {@link SingleSize} that:
 *
 * 1. Associates a unique ID with the size.
 * 2. Treats height and width as strings.
 *
 * The ID is used to control when Lit updates elements. String dimensions
 * allow us to preserve invalid values as users are editing.
 */
type Size = [string, string] | googletag.NamedSize;
interface KeyedSize {
  id: number;
  size?: Size;
}

/**
 * Custom component for displaying/editing GPT slot sizes.
 */
@localized()
@customElement('slot-size-input')
export class SlotSizeInput extends LitElement {
  @state() private dirtyConfig: KeyedSize[] = [];
  private focusIndex?: number;

  static styles = [
    materialIcons,
    css`
      :host {
        width: 100%;
      }

      fieldset {
        display: flex;
        flex-flow: row wrap;
      }

      .size {
        align-items: center;
        display: flex;
        flex-direction: row;
        margin: 0 24px 0;
        padding: 5px;
        width: 100%;
      }

      .size:nth-child(odd) {
        background-color: darkgrey;
        color: white;
      }

      .size:nth-child(odd) .material-icons {
        color: black;
      }

      .dimensions input,
      .size-input {
        flex: 1;
      }

      .size-controls {
        display: flex;
        align-self: flex-start;
      }

      .dimensions {
        display: flex;
      }

      .dimension-separator {
        padding: 0 5px 0;
      }

      .add-size {
        width: 100%;
        text-align: center;
        margin: 0 24px 0;
      }

      .button {
        cursor: pointer;
      }

      input:invalid {
        background-color: lightpink;
      }
    `,
  ];

  /**
   * The title to display for the generated `<fieldset>`.
   */
  @property({attribute: 'title', type: String}) title = '';

  /**
   * Set the active slot size config.
   */
  @property({attribute: 'config', type: Array})
  set config(config: googletag.GeneralSize) {
    if (config && !isEqual(config, this.clean(this.dirtyConfig))) {
      this.dirtyConfig = [];

      if (Array.isArray(config)) {
        // Convert SingleSize to MultiSize for simplicity.
        const sizes =
          config.length <= 2 && !Array.isArray(config[0]) ? [config] : config;

        sizes.forEach(s => {
          const size: Size = !Array.isArray(s)
            ? // NamedSize -> 'fluid'
              ([s] as googletag.NamedSize)
            : // NamedSize -> ['fluid']
              s.length === 1
              ? (s as googletag.NamedSize)
              : // SingleSize -> [1,1]
                [String(s[0]), String(s[1])];

          this.dirtyConfig.push({id: Date.now(), size});
        });
      } else {
        // NamedSize -> 'fluid'
        this.dirtyConfig.push({id: Date.now(), size: [config]});
      }
    }
  }

  /**
   * Get the active slot configuration.
   */
  get config() {
    return this.clean(this.dirtyConfig);
  }

  /**
   * Returns a "clean" copy of the provided config.
   */
  private clean(config: KeyedSize[]) {
    const cleanConfig: googletag.SingleSize[] = [];

    config.forEach(({size}) => {
      if (Array.isArray(size)) {
        if (size.length === 1 && size[0]) {
          // NamedSize -> ['fluid']
          cleanConfig.push(size[0]);
        } else {
          // SingleSize -> [1,1]
          if (
            DIMENSION_VALIDATION_REGEX.test(size[0]) &&
            DIMENSION_VALIDATION_REGEX.test(size[1])
          ) {
            cleanConfig.push([Number(size[0]), Number(size[1])]);
          }
        }
      } else if (size) {
        // NamedSize -> 'fluid'
        cleanConfig.push(size);
      }
    });

    return cleanConfig.length === 1 ? cleanConfig[0] : Array.from(cleanConfig);
  }

  /**
   * Create a copy of the "dirty" config object.
   */
  private cloneConfig(): KeyedSize[] {
    return structuredClone(this.dirtyConfig);
  }

  /**
   * Update the "dirty" config object.
   */
  private updateConfig(updatedConfig: KeyedSize[]) {
    // Check whether changes affect the "clean" config.
    const cleanConfigUpdated = !isEqual(
      this.clean(updatedConfig),
      this.clean(this.dirtyConfig),
    );

    this.dirtyConfig = updatedConfig;

    if (cleanConfigUpdated) {
      // Fire an event to let the configurator know a value has changed.
      this.dispatchEvent(
        new CustomEvent('update', {bubbles: true, composed: true}),
      );
    }
  }

  /**
   * Helper method to determine whether the provided size is a NamedSize.
   */
  private isNamedSize(size: Size) {
    const namedSizes = ['fluid'];
    return Array.isArray(size)
      ? size.length === 1 && namedSizes.includes(size[0])
      : namedSizes.includes(size);
  }

  /**
   * Helper method to create a Size object from HTML.
   * Note that the returned object is not "cleaned" in any way.
   */
  size(sizeElem: HTMLElement): Size {
    const fluidElem = sizeElem.querySelector(
      'input[name=fluid]',
    ) as HTMLInputElement;

    if (fluidElem.checked) {
      return ['fluid'];
    } else {
      const widthElem = sizeElem.querySelector(
        'input[name=width]',
      ) as HTMLInputElement;
      const heightElem = sizeElem.querySelector(
        'input[name=height]',
      ) as HTMLInputElement;

      return [widthElem.value, heightElem.value];
    }
  }

  private addSize() {
    const config = this.cloneConfig();
    config.push({id: Date.now()});

    // Attempt to focus the newly added row.
    this.focusIndex = config.length - 1;
    this.updateConfig(config);
  }

  private removeSize(event: Event) {
    const config = this.cloneConfig();

    const parent = (event.target as HTMLElement).closest('.size');
    const index = Array.from(this.renderRoot.querySelectorAll('.size')).indexOf(
      parent!,
    );

    config.splice(index, 1);

    // Attempt to focus the previous row.
    this.focusIndex = Math.max(index - 1, 0);
    this.updateConfig(config);
  }

  private updateSize(event: Event) {
    const config = this.cloneConfig();

    const parent = (event.target as HTMLElement).closest('.size');
    const index = Array.from(this.renderRoot.querySelectorAll('.size')).indexOf(
      parent!,
    );

    config[index].size = this.size(parent as HTMLElement);
    this.updateConfig(config);
  }

  private renderDimensions(size?: Size) {
    const namedSize = size && this.isNamedSize(size);

    return html`
      <div class="dimensions">
        <input
          type="text"
          maxlength="4"
          name="width"
          pattern="${DIMENSION_VALIDATION_PATTERN}"
          placeholder="${strings.widthPlaceholder()}"
          value="${!size || namedSize ? nothing : size[0]}"
          ?disabled="${namedSize}"
          @input="${this.updateSize}"
        />
        <span class="dimension-separator">x</span>
        <input
          type="text"
          maxlength="4"
          name="height"
          pattern="${DIMENSION_VALIDATION_PATTERN}"
          placeholder="${strings.heightPlaceholder()}"
          value="${!size || namedSize ? nothing : size[1]}"
          ?disabled="${namedSize}"
          @input="${this.updateSize}"
        />
      </div>
    `;
  }

  private renderNamedSizes(size?: Size) {
    const fluid = size && this.isNamedSize(size);

    return html`
      <div class="fluid">
        <input
          name="fluid"
          type="checkbox"
          ?checked="${fluid}"
          @input="${this.updateSize}"
        />
        <label for="fluid">${strings.fluidLabel()}</label>
      </div>
    `;
  }

  private renderSize(size: KeyedSize) {
    return html` ${keyed(
      size.id,
      html`
        <div class="size">
          <div class="size-input">
            ${this.renderDimensions(size.size)}
            ${this.renderNamedSizes(size.size)}
          </div>
          <div class="size-controls">
            <span
              class="material-icons md-24 button"
              title="${strings.removeSizeTitle()}"
              @click="${this.removeSize}"
              >delete</span
            >
          </div>
        </div>
      `,
    )}`;
  }

  render() {
    const sizes: TemplateResult[] = [];
    this.dirtyConfig.forEach(size => {
      sizes.push(this.renderSize(size));
    });

    return html`
      <fieldset>
        <legend>${this.title}</legend>
        ${sizes}
        <span
          class="material-icons md-24 add-size button"
          title="${strings.addSizeTitle()}"
          @click="${this.addSize}"
          >add</span
        >
      </fieldset>
    `;
  }

  updated() {
    if (this.focusIndex === undefined) return;

    // Focus the first input of the specified size.
    const container =
      this.renderRoot.querySelectorAll('.size')[this.focusIndex!];
    (container?.querySelector('input[name=width]') as HTMLElement)?.focus();

    this.focusIndex = undefined;
  }
}
