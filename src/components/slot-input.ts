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

import './slot-size-input'
import './targeting-input'

import {css, html, LitElement, ReactiveElement, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {isEqual} from 'lodash-es';

import type {SampleSlotConfig} from '../model/sample-config.js';

import {sampleAds} from './shared/sample-ads.js';
import {materialStyles} from './shared/styles.js';
import {SlotSizeInput} from './slot-size-input.js';
import {TargetingInput} from './targeting-input.js';

// Constant UI strings.
const ADD_SLOT_TITLE = 'Add slot';
const AD_UNIT_LABEL = 'Ad unit path';
const CUSTOM_OPTION_LABEL = 'Custom';
const REMOVE_SLOT_TITLE = 'Remove slot';
const SAMPLE_ADS_LABEL = 'Sample Ads';
const SIZE_SECTION_TITLE = 'Sizes'
const TARGETING_SECTION_TITLE = 'Targeting';

// Ad unit path validation.
const AD_UNIT_VALIDATION_PATTERN = '[\\da-zA-Z_\\-.*\\/\\\\!:\\(\\)]+';
const AD_UNIT_VALIDATION_REGEX = new RegExp(`^${AD_UNIT_VALIDATION_PATTERN}$`);

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

/**
 * Custom component for displaying/editing GPT slots.
 */
@customElement('slot-input')
export class SlotInput extends LitElement {
  @state() private dirtyConfig: KeyedSlot[] = [];

  static styles = [
    materialStyles, css`
      :host {
        width: 100%
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

      .slot-option label {
        padding-right: 5px;
      }

      .add-slot{
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
      }`
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
        this.dirtyConfig.push(
            {id: Date.now(), slot: slot, template: this.isTemplateAd(slot)});
      });
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
      if (slot.adUnit && slot.size.length > 0 &&
          AD_UNIT_VALIDATION_REGEX.test(slot.adUnit)) {
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
    const cleanConfigUpdated =
        !isEqual(this.clean(updatedConfig), this.clean(this.dirtyConfig));

    this.dirtyConfig = updatedConfig;

    if (cleanConfigUpdated) {
      console.log(JSON.stringify(this.dirtyConfig));
      // Fire an event to let the configurator know a value has changed.
      this.dispatchEvent(
          new CustomEvent('update', {bubbles: true, composed: true}));
    }
  }

  /**
   * Helper method to determine whether a given slot config matches a known
   * sample ad.
   */
  private isTemplateAd(slot: SampleSlotConfig) {
    return sampleAds.filter(sampleAd => isEqual(slot, sampleAd.slot)).length >
        0;
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
    const index =
        Array.from(this.renderRoot.querySelectorAll('.slot')).indexOf(parent);

    config.splice(index, 1);
    this.updateConfig(config);
  }

  private updateSlot(event: Event) {
    const config = this.cloneConfig();

    const parent = (event.target as HTMLElement).closest('.slot')!;
    const index =
        Array.from(this.renderRoot.querySelectorAll('.slot')).indexOf(parent);

    const template = (parent.querySelector('select') as HTMLSelectElement)
                         .selectedOptions[0];

    if (template.dataset && template.dataset.index) {
      // A sample ad was selected.
      config[index].template = true;
      config[index].slot = sampleAds[Number(template.dataset.index)].slot;
    } else {
      // The custom option was selected.
      config[index].template = false;

      // Prepopulate inputs with any previously selected sample ad values.
      config[index].slot = {
        adUnit: (parent.querySelector('input[name=adUnit]') as HTMLInputElement)
                    .value,
        size: (parent.querySelector('slot-size-input') as ReactiveElement as
               SlotSizeInput)
                  .config,
        targeting: (parent.querySelector('targeting-input') as
                    ReactiveElement as TargetingInput)
                       .config
      }
    }

    this.updateConfig(config);
  }

  private renderSlotTemplates(slot: SampleSlotConfig) {
    const templates: TemplateResult[] = []
    sampleAds.forEach((sampleAd, i) => {
      const option = html`
        <option
          data-index="${i}"
          ?selected="${isEqual(slot, sampleAd.slot)}"
        >${sampleAd.name}</option>`
      templates.push(option);
    });

    return html`
      <select
        class="flex padded"
        @input="${this.updateSlot}"
      >
        <option>${CUSTOM_OPTION_LABEL}</option>
        <optgroup label="${SAMPLE_ADS_LABEL}">
          ${templates}
        </optgroup>
      </select>`;
  }

  private renderSlotOptions(slot: SampleSlotConfig) {
    return html`
      <div class="slot-option flex">
        <label for="adUnit">${AD_UNIT_LABEL}</label>
        <input
          class="flex"
          type="text"
          name="adUnit"
          pattern="${AD_UNIT_VALIDATION_PATTERN}"
          value="${slot.adUnit}"
          @input="${this.updateSlot}" />
      </div>`;
  }

  private renderSlotSizeInput(slot: SampleSlotConfig) {
    return html`
      <slot-size-input
        title="${SIZE_SECTION_TITLE}"
        .config="${slot.size}"
        @update="${this.updateSlot}"
       ></slot-size-input>`;
  }

  private renderTargetingInput(slot: SampleSlotConfig) {
    return html`
      <targeting-input
        title="${TARGETING_SECTION_TITLE}"
        .config="${slot.targeting}"
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
      <div class="${classMap(classes)}">
        ${this.renderSlotSizeInput(slot)}
      </div>
      <div class="${classMap(classes)}">
        ${this.renderTargetingInput(slot)}
      </div>`;
  }

  private renderSlot(slot: KeyedSlot, index: number) {
    return html`
      <div class="slot flex">
        <span class="slot-id">${index + 1}</span>
        <div class="slot-settings flex">
          ${this.renderSlotTemplates(slot.slot)}
          <span
            class="material-icons md-24 button"
            title="${REMOVE_SLOT_TITLE}"
            @click="${this.removeSlot}"
          >delete</span>
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
        >add</span>
      </fieldset>
    `;
  }
}