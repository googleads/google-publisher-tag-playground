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

import './config-section';

import {localized, msg} from '@lit/localize';
import {css, html, LitElement, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {keyed} from 'lit/directives/keyed.js';
import {isEqual} from 'lodash-es';

import type {SampleTargetingKV} from '../../model/sample-config.js';
import {materialIcons} from '../styles/material-icons.js';

// Constant UI strings.
const strings = {
  addKeyTitle: () => msg('Add targeting key', {desc: 'Button title'}),
  addValueTitle: () => msg('Add targeting value', {desc: 'Button title'}),
  keyColumnHeader: () =>
    msg('Key', {desc: 'The key portion of a targeting key-value.'}),
  removeValueTitle: () => msg('Remove targeting value', {desc: 'Button title'}),
  valuesColumnHeader: () =>
    msg('Values', {desc: 'The values portion of a targeting key-value.'}),
};

// Characters invalid for both keys and values.
const INVALID_CHARACTERS = '"\'=!+#\\*~;\\^\\(\\)<>\\[\\],&';

// Key-specific validation:
// 1. Can't start with a number.
// 2. Can't contain any (shared) invalid characters.
// 3. Can't contain spaces.
// 4. Must be <= 20 characters.
const KEY_VALIDATION_PATTERN = `(?!\\d)[^${INVALID_CHARACTERS}\\s]{1,20}`;
const KEY_VALIDATION_REGEX = new RegExp(`^${KEY_VALIDATION_PATTERN}$`);

// Value-specific validation:
// 1. Can't contain any (shared) invalid characters.
// 2. Must be <= 40 characters.
const VALUE_VALIDATION_PATTERN = `[^${INVALID_CHARACTERS}]{1,40}`;
const VALUE_VALIDATION_REGEX = new RegExp(`^${VALUE_VALIDATION_PATTERN}$`);

/**
 * A wrapper around {@link SampleTargetingKV} that associates a unique ID
 * with a key-value pair. This ID can be passed to Lit to prevent DOM
 * elements from being improperly reused as key-values are added/removed.
 */
interface KeyedSampleTargetingKV {
  id: number;
  targeting: SampleTargetingKV;
}

/**
 * Custom component for displaying/editing GPT targeting key-values.
 */
@localized()
@customElement('targeting-input')
export class TargetingInput extends LitElement {
  /**
   * The "dirty" config contains the current (potentially invalid) targeting
   * key-values, as configured by the user. This is in contrast to the public
   * {@link config}, which always returns a clean, valid config based
   * on the current configuration.
   */
  @state() private dirtyConfig: KeyedSampleTargetingKV[] = [];
  private focusIndex?: number;

  static styles = [
    materialIcons,
    css`
      :host {
        width: 100%;
      }

      .header,
      .key-value {
        display: flex;
        flex-direction: row;
        width: 100%;
      }

      .header {
        margin: 0 24px 0;
      }

      .key-value {
        padding: 5px;
        margin-left: 24px;
      }

      .key-value:nth-child(odd) {
        background-color: darkgrey;
      }

      .header span,
      .key,
      .values {
        align-items: baseline;
        display: flex;
        flex: 1;
        justify-content: center;
      }

      .key,
      .values {
        flex-direction: column;
        flex: 1;
        align-items: center;
        padding: 5px;
      }

      .key input,
      .value input {
        width: 100%;
      }

      .value {
        display: flex;
        justify-content: center;
        width: 100%;
      }

      .add-key {
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
   * The title to display for the generated `<config-section>`.
   */
  @property({attribute: 'title', type: String}) title = '';

  /**
   * Set active targeting configuration.
   */
  @property({attribute: 'config', type: Array})
  set config(config: SampleTargetingKV[]) {
    if (config && !isEqual(config, this.clean(this.dirtyConfig))) {
      this.dirtyConfig = [];
      config.forEach(kv => {
        this.dirtyConfig.push({id: Date.now(), targeting: kv});
      });
    }
  }

  /**
   * Get the active targeting configuration.
   */
  get config() {
    return this.clean(this.dirtyConfig);
  }

  /**
   * Returns a "clean" copy of the provided config.
   */
  private clean(config: KeyedSampleTargetingKV[]) {
    const cleanConfig: SampleTargetingKV[] = [];

    config.forEach(keyedKV => {
      const {key, value} = keyedKV.targeting;
      if (
        key &&
        key.trim().length > 0 &&
        KEY_VALIDATION_REGEX.test(key.trim())
      ) {
        const values = Array.isArray(value) ? value : [value];
        const cleanValues = values.filter(
          v => v && v.trim().length > 0 && VALUE_VALIDATION_REGEX.test(v),
        );
        if (cleanValues.length > 0) {
          cleanConfig.push({
            key,
            value: cleanValues.length > 1 ? cleanValues : cleanValues[0],
          });
        }
      }
    });

    return cleanConfig;
  }

  /**
   * Create a copy of the "dirty" config object.
   */
  private cloneConfig() {
    return structuredClone(this.dirtyConfig);
  }

  /**
   * Update the "dirty" config object.
   */
  private updateConfig(updatedConfig: KeyedSampleTargetingKV[]) {
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

  private addKey() {
    const config = this.cloneConfig();
    config.push({id: Date.now(), targeting: {key: '', value: ''}});

    // Force the key input to be focused on update.
    this.focusIndex = config.length - 1;
    this.updateConfig(config);
  }

  private updateKey(event: InputEvent) {
    // Retrieve key-value index from the enclosing div.
    const parent = (event.target as HTMLElement).closest('.key-value')!;
    const index = Number(parent.id);

    const config = this.cloneConfig();
    config[index].targeting.key = (event.target as HTMLInputElement).value;
    this.updateConfig(config);
  }

  private removeKey(event: Event) {
    // Retrieve key-value index from the enclosing div.
    const parent = (event.target as HTMLElement).closest('.key-value')!;
    const index = Number(parent.id);

    const config = this.cloneConfig();
    config.splice(index, 1);

    // Maybe focus the nearest empty key/value on update.
    this.focusIndex = Math.max(index - 1, 0);
    this.updateConfig(config);
  }

  private addValue(event: Event) {
    // Retrieve key-value index from the enclosing div.
    const parent = (event.target as HTMLElement).closest('.key-value')!;
    const index = Number(parent.id);

    let values = this.dirtyConfig[index].targeting.value;
    values = Array.isArray(values) ? values : [values];

    const config = this.cloneConfig();
    config[index].targeting.value = [...values, ''];

    // Force the value input to be focused on update.
    this.focusIndex = index;
    this.updateConfig(config);
  }

  private removeValue(event: Event) {
    // Retrieve the associated value input.
    const parent = (event.target as HTMLElement).closest('.value')!;
    const input = parent.querySelector('input');

    // Retrieve key-value index from the enclosing div.
    const grandparent = parent.closest('.key-value')!;
    const index = Number(grandparent.id);

    // Rebuild the entire values array, excluding the value being removed.
    const config = this.cloneConfig();
    config[index].targeting.value = Array.from(
      grandparent.querySelectorAll('.value input'),
    )
      .filter(e => e !== input)
      .map(e => (e as HTMLInputElement).value);

    // Update the unique ID for this row to force the template to refresh.
    // TODO: look into keying individual values, to make updates more efficient.
    config[index].id = Date.now();

    if (
      !config[index].targeting.value ||
      config[index].targeting.value.length === 0
    ) {
      // No values remain, so remove the key.
      this.removeKey(event);
    } else {
      // Maybe focus the nearest key/value input on update.
      this.focusIndex = index;
      this.updateConfig(config);
    }
  }

  private updateValue(event: InputEvent) {
    // Retrieve key-value index from the enclosing div.
    const parent = (event.target as HTMLElement).closest('.key-value')!;
    const index = Number(parent.id);

    // Rebuild the entire values array.
    const config = this.cloneConfig();
    config[index].targeting.value = Array.from(
      parent.querySelectorAll('.value input'),
    ).map(e => (e as HTMLInputElement).value);
    this.updateConfig(config);
  }

  private renderValues(value: string | string[]) {
    const values = Array.isArray(value) ? value : [value];

    const valueElems: TemplateResult[] = [];
    values.forEach((value, i) => {
      // The last value gets an "Add" button. The rest get a spacer.
      const addOrSpacer =
        i < values.length - 1
          ? html`<span class="spacer"></span>`
          : html`<span
              class="material-icons md-24 button"
              @click="${this.addValue}"
              title="${strings.addValueTitle()}"
              >add</span
            >`;

      valueElems.push(
        html` <div class="value">
          <input
            type="text"
            value="${value}"
            maxlength="40"
            pattern="${VALUE_VALIDATION_PATTERN}"
            @input="${this.updateValue}"
          />
          <span
            class="material-icons md-24 button"
            @click="${this.removeValue}"
            title="${strings.removeValueTitle()}"
            >delete</span
          >
          ${addOrSpacer}
        </div>`,
      );
    });

    return valueElems;
  }

  private renderKeyValue(kv: KeyedSampleTargetingKV, index: number) {
    // Manually key these DOM elements by their unique ID, to prevent them from
    // from being reused incorrectly by Lit as rows are added/removed.
    return html` ${keyed(
      kv.id,
      html` <div class="key-value" id="${index}">
        <div class="key">
          <input
            type="text"
            value="${kv.targeting.key}"
            maxlength="20"
            pattern="${KEY_VALIDATION_PATTERN}"
            @input="${this.updateKey}"
          />
        </div>
        <div class="values">${this.renderValues(kv.targeting.value)}</div>
      </div>`,
    )}`;
  }

  render() {
    const keyValues: TemplateResult[] = [];
    this.dirtyConfig.forEach((kv, i) => {
      keyValues.push(this.renderKeyValue(kv, i));
    });

    return html`
      <config-section title="${this.title}">
        <div class="header">
          <span>${strings.keyColumnHeader()}</span>
          <span>${strings.valuesColumnHeader()}</span>
        </div>
        ${keyValues}
        <span
          class="material-icons md-24 button add-key"
          @click="${this.addKey}"
          title="${strings.addKeyTitle()}"
          >add</span
        >
      </config-section>
    `;
  }

  updated() {
    if (this.focusIndex === undefined) return;

    const container =
      this.renderRoot.querySelectorAll('.key-value')[this.focusIndex!];

    // If the key input is empty focus it. Else, if the last value is empty,
    // focus that.
    const key = container?.querySelector('.key input') as HTMLInputElement;
    if (key?.value.trim().length === 0) {
      key.focus();
    } else {
      const values = container?.querySelector('.values');
      const value = values?.lastElementChild?.querySelector(
        'input',
      ) as HTMLInputElement;
      if (value?.value.trim().length === 0) value.focus();
    }

    this.focusIndex = undefined;
  }
}
