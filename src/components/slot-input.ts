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

import './slot-size-input';
import './targeting-input';

import {css, html, LitElement, ReactiveElement, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {when} from 'lit/directives/when.js';
import {isEqual} from 'lodash-es';

import type {SampleSlotConfig} from '../model/sample-config.js';
import {outOfPageFormatNames} from '../model/settings.js';

import {sampleAds} from './shared/sample-ads.js';
import {materialStyles} from './shared/styles.js';
import {SlotSizeInput} from './slot-size-input.js';
import {TargetingInput} from './targeting-input.js';

// Constant UI strings.
const ADD_SLOT_TITLE = 'Add slot';
const AD_UNIT_LABEL = 'Ad unit path';
const CUSTOM_OPTION_LABEL = 'Custom';
const OOP_FORMAT_DISABLED = 'Unavailable';
const OOP_FORMAT_LABEL = 'Out-of-page format';
const OOP_FORMAT_UNSELECTED = 'None';
const REMOVE_SLOT_TITLE = 'Remove slot';
const SAMPLE_ADS_LABEL = 'Sample ads';
const SAMPLE_ADS_OOP_LABEL = 'Sample ads (out-of-page)';
const SIZE_SECTION_TITLE = 'Sizes';
const TARGETING_SECTION_TITLE = 'Targeting';

// Ad unit path validation.
const AD_UNIT_VALIDATION_PATTERN = '[\\da-zA-Z_\\-.*\\/\\\\!:\\(\\)]+';
const AD_UNIT_VALIDATION_REGEX = new RegExp(`^${AD_UNIT_VALIDATION_PATTERN}$`);

// Unsupported out-of-page formats.
const EXCLUDED_OOP_FORMATS = ['GAME_MANUAL_INTERSTITIAL', 'REWARDED'];

/**
 * A wrapper around {@link SampleSlotConfig} that associates additional metadata
 * with a slot config.
 */
interface KeyedSlot {
  id: number;
  slot: SampleSlotConfig;
  /** Whether this slot represents a sample ad template. */
  template: boolean;
}

type OutOfPageFormat = keyof typeof googletag.enums.OutOfPageFormat;

/**
 * Custom component for displaying/editing an array of GPT slots.
 */
@customElement('slot-input')
export class SlotInput extends LitElement {
  @state() private dirtyConfig: KeyedSlot[] = [];
  private disabledFormats = new Set<OutOfPageFormat>();

  static styles = [
    materialStyles,
    css`
      :host {
        width: 100%;
      }

      fieldset {
        display: flex;
        flex-flow: column wrap;
        margin: 15px 0 0;
      }

      .slot {
        padding: 10px;
      }

      .slot:nth-child(odd) {
        background-color: lightgrey;
      }

      .slot-id {
        flex: 0 1;
        align-self: center;
        min-width: 24px;
      }

      .slot-option {
        align-items: center;
        padding: 3px 0;
      }

      .slot-option label {
        min-width: 125px;
        padding-right: 5px;
      }

      .add-slot {
        margin: 0 24px 0;
        text-align: center;
      }

      .button {
        cursor: pointer;
      }

      .flex {
        display: flex;
        flex: 1;
        flex-flow: row wrap;
      }

      .row {
        flex: 0 1 100%;
      }

      .hidden {
        display: none;
      }

      .padded {
        padding: 5px;
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
   * Set the active slot config.
   */
  @property({attribute: 'config', type: Array})
  set config(config: SampleSlotConfig[]) {
    if (config && !isEqual(config, this.clean(this.dirtyConfig))) {
      this.dirtyConfig = [];

      config.forEach(slot => {
        this.dirtyConfig.push({
          id: Date.now(),
          slot: slot,
          template: this.isTemplateAd(slot),
        });
      });

      this.updateDisabledFormats();
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
  private clean(config: KeyedSlot[]) {
    const cleanConfig: SampleSlotConfig[] = [];

    config.forEach(({slot}) => {
      if (
        slot.adUnit &&
        AD_UNIT_VALIDATION_REGEX.test(slot.adUnit) &&
        (slot.format || slot.size.length > 0)
      ) {
        cleanConfig.push(slot);
      }
    });

    return cleanConfig;
  }

  /**
   * Create a copy of the "dirty" config object.
   */
  private cloneConfig(): KeyedSlot[] {
    return structuredClone(this.dirtyConfig);
  }

  /**
   * Update the "dirty" config object.
   */
  private updateConfig(updatedConfig: KeyedSlot[]) {
    // Check whether changes affect the "clean" config.
    const cleanConfigUpdated = !isEqual(
      this.clean(updatedConfig),
      this.clean(this.dirtyConfig),
    );

    this.dirtyConfig = updatedConfig;

    if (cleanConfigUpdated) {
      this.updateDisabledFormats();

      // Fire an event to let the configurator know a value has changed.
      this.dispatchEvent(
        new CustomEvent('update', {bubbles: true, composed: true}),
      );
    }
  }

  /**
   * Determine which {@link OutOfPageFormat}s should be disabled, based on which
   * are currently configured.
   */
  private updateDisabledFormats() {
    const disabledFormats = new Set<OutOfPageFormat>();

    this.dirtyConfig.forEach(keyedSlot => {
      const format = keyedSlot.slot.format;
      if (!format) return;

      if (format === 'BOTTOM_ANCHOR' || format === 'TOP_ANCHOR') {
        // Only one of top or bottom anchor is allowed per page.
        disabledFormats.add('BOTTOM_ANCHOR');
        disabledFormats.add('TOP_ANCHOR');
      } else {
        disabledFormats.add(format);
      }
    });

    this.disabledFormats = disabledFormats;
  }

  /**
   * Helper method to determine if an {@link OutOfPageFormat} should be
   * disabled for a given slot.
   */
  private isFormatDisabledForSlot(
    slot: SampleSlotConfig,
    format: OutOfPageFormat,
  ) {
    if (format === 'BOTTOM_ANCHOR' || format === 'TOP_ANCHOR') {
      // If slot is an anchor, allow swapping between top and bottom formats.
      // Otherwise, disable both if either is selected elsewhere.
      return (
        this.disabledFormats.has(format) &&
        slot.format !== 'BOTTOM_ANCHOR' &&
        slot.format !== 'TOP_ANCHOR'
      );
    }

    return this.disabledFormats.has(format) && slot.format !== format;
  }

  /**
   * Helper method to determine whether a given slot config matches a known
   * sample ad.
   */
  private isTemplateAd(slot: SampleSlotConfig) {
    return sampleAds.some(sampleAd => isEqual(slot, sampleAd.slot));
  }

  private addSlot() {
    const config = this.cloneConfig();
    // Select the first sample ad by default.
    config.push({id: Date.now(), slot: sampleAds[0].slot, template: true});
    this.updateConfig(config);
  }

  private removeSlot(event: Event) {
    const config = this.cloneConfig();

    const parent = (event.target as HTMLElement).closest('.slot')!;
    const index = Array.from(this.renderRoot.querySelectorAll('.slot')).indexOf(
      parent,
    );

    config.splice(index, 1);
    this.updateConfig(config);
  }

  private updateSlot(event: Event) {
    const config = this.cloneConfig();

    const parent = (event.target as HTMLElement).closest('.slot')!;
    const index = Array.from(this.renderRoot.querySelectorAll('.slot')).indexOf(
      parent,
    );

    const template = (
      parent.querySelector('select[name=templates]') as HTMLSelectElement
    ).selectedOptions[0];

    if (template.dataset && template.dataset.index) {
      // A sample ad was selected.
      config[index].template = true;
      config[index].slot = sampleAds[Number(template.dataset.index)].slot;
    } else {
      // The custom option was selected.
      config[index].template = false;

      // Prepopulate inputs with any previously selected sample ad values.
      const adUnitPath = parent.querySelector(
        'input[name=adUnit]',
      ) as HTMLInputElement;
      const format = (
        parent.querySelector('select[name=formats]') as HTMLSelectElement
      )?.selectedOptions[0];
      const sizes = parent.querySelector(
        'slot-size-input',
      ) as ReactiveElement as SlotSizeInput;
      const targeting = parent.querySelector(
        'targeting-input',
      ) as ReactiveElement as TargetingInput;

      config[index].slot = {
        adUnit: adUnitPath?.value,
        format: format?.value as OutOfPageFormat,
        size: sizes?.config || [],
        targeting: targeting?.config || [],
      };
    }

    this.updateConfig(config);
  }

  private renderSlotTemplates(slot: SampleSlotConfig) {
    const templates: TemplateResult[] = [];
    const oopTemplates: TemplateResult[] = [];

    sampleAds.forEach((sampleAd, i) => {
      const format = sampleAd.slot.format as OutOfPageFormat;
      const disabled = this.isFormatDisabledForSlot(slot, format);
      const template = html` <option
        data-index="${i}"
        ?disabled="${disabled}"
        ?selected="${isEqual(slot, sampleAd.slot)}"
      >
        ${sampleAd.name} ${when(disabled, () => ` (${OOP_FORMAT_DISABLED})`)}
      </option>`;
      (format ? oopTemplates : templates).push(template);
    });

    return html` <select
      class="flex padded"
      name="templates"
      @input="${this.updateSlot}"
    >
      <option>${CUSTOM_OPTION_LABEL}</option>
      <optgroup label="${SAMPLE_ADS_LABEL}">${templates}</optgroup>
      <optgroup label="${SAMPLE_ADS_OOP_LABEL}">${oopTemplates}</optgroup>
    </select>`;
  }

  private renderSlotFormatInput(slot: SampleSlotConfig) {
    const formats: TemplateResult[] = [];
    Object.entries(outOfPageFormatNames)
      // Remove formats we don't yet support.
      .filter(([k, v]) => !EXCLUDED_OOP_FORMATS.includes(k as OutOfPageFormat))
      .forEach(([k, v]) => {
        const format = k as OutOfPageFormat;
        const disabled = this.isFormatDisabledForSlot(slot, format);
        const option = html` <option
          value="${k}"
          ?disabled="${disabled}"
          ?selected="${slot.format === format}"
        >
          ${v} ${when(disabled, () => ` (${OOP_FORMAT_DISABLED})`)}
        </option>`;
        formats.push(option);
      });

    return html`
      <select class="flex padded" name="formats" @input="${this.updateSlot}">
        <option value="">${OOP_FORMAT_UNSELECTED}</option>
        ${formats}
      </select>
    `;
  }

  private renderSlotOptions(slot: SampleSlotConfig) {
    return html` <div class="slot-option flex">
        <label for="adUnit">${AD_UNIT_LABEL}</label>
        <input
          class="flex padded"
          type="text"
          name="adUnit"
          pattern="${AD_UNIT_VALIDATION_PATTERN}"
          value="${slot.adUnit}"
          @input="${this.updateSlot}"
        />
      </div>
      <div class="slot-option flex">
        <label for="format">${OOP_FORMAT_LABEL}</label>
        ${this.renderSlotFormatInput(slot)}
      </div>`;
  }

  private renderSlotSizeInput(slot: SampleSlotConfig) {
    return html` <slot-size-input
      title="${SIZE_SECTION_TITLE}"
      .config="${slot.size}"
      @update="${this.updateSlot}"
    ></slot-size-input>`;
  }

  private renderTargetingInput(slot: SampleSlotConfig) {
    return html` <targeting-input
      title="${TARGETING_SECTION_TITLE}"
      .config="${slot.targeting || []}"
      @update="${this.updateSlot}"
    ></targeting-input>`;
  }

  private renderSlotSettings(slot: SampleSlotConfig, hidden: boolean) {
    const classes = {row: true, hidden};
    const classesWithPadding = {...classes, padded: true};

    return html`
      <div class="${classMap(classesWithPadding)}">
        ${this.renderSlotOptions(slot)}
      </div>
      ${when(
        !slot.format,
        () => html`
          <div class="${classMap(classes)}">
            ${this.renderSlotSizeInput(slot)}
          </div>
        `,
      )}
      <div class="${classMap(classes)}">${this.renderTargetingInput(slot)}</div>
    `;
  }

  private renderSlot(slot: KeyedSlot, index: number) {
    return html` <div class="slot flex">
      <span class="slot-id">${index + 1}</span>
      <div class="slot-settings flex">
        ${this.renderSlotTemplates(slot.slot)}
        <span
          class="material-icons md-24 button"
          title="${REMOVE_SLOT_TITLE}"
          @click="${this.removeSlot}"
          >delete</span
        >
        ${this.renderSlotSettings(slot.slot, slot.template)}
      </div>
    </div>`;
  }

  render() {
    const slots: TemplateResult[] = [];
    this.dirtyConfig.forEach((slot, i) => {
      slots.push(this.renderSlot(slot, i));
    });

    return html`
      <fieldset>
        <legend>${this.title}</legend>
        ${slots}
        <span
          class="material-icons md-24 add-slot button"
          title="${ADD_SLOT_TITLE}"
          @click="${this.addSlot}"
          >add</span
        >
      </fieldset>
    `;
  }
}
