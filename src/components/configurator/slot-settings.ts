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

import '../ui-controls/configurator-checkbox';
import '../ui-controls/config-section';
import '../ui-controls/configurator-icon-button';
import '../ui-controls/configurator-format-select';
import '../ui-controls/configurator-text-field';
import '../ui-controls/slot-size-input';
import '../ui-controls/targeting-input';

import {localized, msg} from '@lit/localize';
import {css, html, LitElement, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {when} from 'lit/directives/when.js';
import {isEqual} from 'lodash-es';

import {sampleAds} from '../../model/sample-ads.js';
import type {SampleSlotConfig} from '../../model/sample-config.js';
import {
  configNames,
  interstitialConfigNames,
  interstitialTriggerNames,
  outOfPageFormatNames,
  slotConfigNames,
  slotSettingsConfigNames,
} from '../../model/settings.js';
import {AdExclusionInput} from '../ui-controls/ad-exclusion-input.js';
import {ConfiguratorCheckbox} from '../ui-controls/configurator-checkbox.js';
import {
  ConfiguratorFormatOptGroup,
  ConfiguratorFormatOption,
  ConfiguratorFormatSelect,
  ConfiguratorFormatSelectOption,
} from '../ui-controls/configurator-format-select.js';
import {ConfiguratorTextField} from '../ui-controls/configurator-text-field.js';
import {SlotSizeInput} from '../ui-controls/slot-size-input.js';
import {TargetingInput} from '../ui-controls/targeting-input.js';

// Constant UI strings.
const strings = {
  addSlotTitle: () => msg('Add slot', {desc: 'Button text'}),
  defaultInterstitialTrigger: () =>
    msg('Link click', {desc: 'The action of clicking on a link.'}),
  customOptionLabel: () =>
    msg('Custom', {
      desc: 'Drop-down option that allows users to input custom ad slot values.',
    }),
  oopFormatUnselected: () =>
    msg('None', {desc: 'Option indicating no out-of-page format is selected.'}),
  removeSlotTitle: () => msg('Remove slot', {desc: 'Button title'}),
  sampleAdsLabel: () => msg('Sample ads', {desc: 'Option group label'}),
  sampleAdsOopLabel: () =>
    msg('Sample ads (out-of-page)', {desc: 'Option group label'}),
  slotTemplateLabel: () => msg('Slot template', {desc: 'Drop-down label'}),
  validationErrorAdUnitPath: () =>
    msg('Please specify a valid ad unit path.', {desc: 'Validation error.'}),
};

// Ad unit path validation.
const AD_UNIT_VALIDATION_PATTERN =
  '\\/\\d+(,\\d+)?(\\/[\\da-zA-Z_\\-.*\\/\\\\!\\[:\\(\\)]{1,100})*(\\/)?';
const AD_UNIT_VALIDATION_REGEX = new RegExp(`^${AD_UNIT_VALIDATION_PATTERN}$`);

// Unsupported out-of-page formats.
const EXCLUDED_OOP_FORMATS = [
  'AD_INTENTS',
  'GAME_MANUAL_INTERSTITIAL',
  'REWARDED',
];

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
@localized()
@customElement('slot-settings')
export class SlotSettings extends LitElement {
  @state() private dirtyConfig: KeyedSlot[] = [];

  static styles = [
    css`
      :host {
        width: 100%;
      }

      .add-slot {
        text-align: center;
        width: 100%;
      }

      .hidden {
        display: none !important;
      }

      .slot {
        align-items: center;
        display: grid;
        grid:
          'id template delete'
          'id settings settings'
          / 24px minmax(150px, 1fr) 24px;
        padding: 10px;
        width: 100%;
      }

      .slot:nth-child(even) {
        background-color: var(--md-sys-color-surface-container-highest);
      }

      .slot-id {
        grid-area: id;
      }

      .slot-template {
        grid-area: template;
      }

      .slot-delete {
        grid-area: delete;
      }

      .slot-settings {
        border-inline-start: 1px solid var(--md-sys-color-surface-dim);
        display: flex;
        flex-flow: row wrap;
        grid-area: settings;
        padding: 0 0 0 10px;
      }

      configurator-checkbox[name='storage'] {
        width: 100%;
      }
    `,
  ];

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
      // Fire an event to let the configurator know a value has changed.
      this.dispatchEvent(
        new CustomEvent('update', {bubbles: true, composed: true}),
      );
    }
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
      parent.querySelector('[name=templates]') as ConfiguratorFormatSelect
    )?.selectedOptions[0];

    if (template?.value) {
      // A sample ad was selected.
      config[index].template = true;
      config[index].slot = sampleAds[Number(template.value)].slot;
    } else {
      // The custom option was selected.
      config[index].template = false;

      // Prepopulate inputs with any previously selected sample ad values.
      const adUnitPath = parent.querySelector(
        '[name=adUnit]',
      ) as ConfiguratorTextField;
      const format = parent.querySelector(
        '[name=formats]',
      ) as ConfiguratorFormatSelect;
      const sizes = parent.querySelector('slot-size-input') as SlotSizeInput;

      config[index].slot = {
        adUnit: adUnitPath?.value || '',
        format: format?.format,
        size: sizes?.config || [],
      };

      this.updateSlotConfig(config[index].slot, parent);
    }

    this.updateConfig(config);
  }

  private updateSlotConfig(slot: SampleSlotConfig, parent: Element) {
    // Populate slot-level config.
    const slotConfig: googletag.config.SlotSettingsConfig = {};

    const targeting = parent.querySelector('targeting-input') as TargetingInput;
    slotConfig.targeting = targeting?.config;

    const exclusions = parent.querySelector(
      'ad-exclusion-input',
    ) as AdExclusionInput;
    slotConfig.categoryExclusion =
      exclusions?.config.length > 0 ? exclusions?.config : undefined;

    if (slot.format === 'INTERSTITIAL') {
      const interstitialConfig: googletag.config.InterstitialConfig = {};

      const requireStorageAccess = (
        parent.querySelector('[name=storage]') as ConfiguratorCheckbox
      )?.checked;

      if (requireStorageAccess) {
        interstitialConfig.requireStorageAccess = true;
      }

      const triggers: Partial<
        Record<googletag.config.InterstitialTrigger, boolean>
      > = {};
      Object.keys(interstitialTriggerNames).map(key => {
        const trigger = key as googletag.config.InterstitialTrigger;
        const triggerEnabled = (
          parent.querySelector(`[name=${trigger}]`) as ConfiguratorCheckbox
        )?.checked;
        if (triggerEnabled) triggers[trigger] = true;
      });

      if (Object.keys(triggers).length > 0) {
        interstitialConfig.triggers = triggers;
      }

      if (Object.keys(interstitialConfig).length > 0) {
        slotConfig.interstitial = interstitialConfig;
      }
    }

    if (Object.keys(slotConfig).length > 0) {
      slot.config = slotConfig;
    }
  }

  private renderInterstitialSlotSettings(slot: SampleSlotConfig) {
    const triggers: TemplateResult[] = [];

    // Add a disabled checkbox to represent the default trigger, which isn't
    // customizable.
    triggers.push(html`
      <configurator-checkbox
        label="${strings.defaultInterstitialTrigger()}"
        ?checked=${true}
        ?disabled=${true}
      ></configurator-checkbox>
    `);

    Object.entries(interstitialTriggerNames).map(([key, label]) => {
      const trigger = key as googletag.config.InterstitialTrigger;
      triggers.push(
        html` <configurator-checkbox
          label="${label()}"
          name="${trigger}"
          ?checked="${slot.config?.interstitial?.triggers?.[trigger]}"
          @update="${this.updateSlot}"
        ></configurator-checkbox>`,
      );
    });

    return html`
      <configurator-checkbox
        label="${interstitialConfigNames.requireStorageAccess()}"
        name="storage"
        ?checked="${slot.config?.interstitial?.requireStorageAccess}"
        @update="${this.updateSlot}"
      ></configurator-checkbox>
      <config-section
        title="${interstitialConfigNames.triggers()}"
        ?nested=${true}
      >
        ${triggers}
      </config-section>
    `;
  }

  private renderSlotTemplates(slot: SampleSlotConfig) {
    const templates: ConfiguratorFormatOptGroup = {
      label: strings.sampleAdsLabel(),
      options: [],
    };

    const oopTemplates: ConfiguratorFormatOptGroup = {
      label: strings.sampleAdsOopLabel(),
      options: [],
    };

    let isTemplate = false;
    sampleAds.forEach((sampleAd, i) => {
      const format = sampleAd.slot.format as OutOfPageFormat;
      const selected = isEqual(slot, sampleAd.slot);
      const template: ConfiguratorFormatOption = {
        label: sampleAd.name(),
        selected: selected,
        value: String(i),
        format: format,
      };
      (format ? oopTemplates : templates).options.push(template);
      isTemplate = isTemplate || selected;
    });

    const options: ConfiguratorFormatSelectOption[] = [
      {
        label: strings.customOptionLabel(),
        selected: !isTemplate,
        value: '',
        format: slot.format,
      },
      templates,
      oopTemplates,
    ];

    return html`<configurator-format-select
      class="slot-template"
      label="${strings.slotTemplateLabel()}"
      name="templates"
      .options="${options}"
      @update="${this.updateSlot}"
    >
    </configurator-format-select>`;
  }

  private renderSlotFormatInput(slot: SampleSlotConfig) {
    const formats: ConfiguratorFormatSelectOption[] = [
      {
        // Add the "no format selected" option.
        label: strings.oopFormatUnselected(),
        selected: !slot.format,
        value: '',
      },
    ];

    Object.entries(outOfPageFormatNames)
      // Remove formats we don't yet support.
      .filter(([k]) => !EXCLUDED_OOP_FORMATS.includes(k as OutOfPageFormat))
      .forEach(([k, v]) => {
        formats.push({
          label: v(),
          selected: slot.format === (k as OutOfPageFormat),
          format: k,
        } as ConfiguratorFormatOption);
      });

    return html`
      <configurator-format-select
        label="${slotConfigNames.format()}"
        name="formats"
        .options="${formats}"
        @update="${this.updateSlot}"
      ></configurator-format-select>
    `;
  }

  private renderSlotOptions(slot: SampleSlotConfig) {
    return html` <configurator-text-field
        label="${slotConfigNames.adUnit()}"
        error-text="${strings.validationErrorAdUnitPath()}"
        name="adUnit"
        pattern="${AD_UNIT_VALIDATION_PATTERN}"
        value="${slot.adUnit}"
        @update="${this.updateSlot}"
      ></configurator-text-field>
      ${this.renderSlotFormatInput(slot)}`;
  }

  private renderSlotSizeInput(slot: SampleSlotConfig) {
    return html` <slot-size-input
      title="${slotConfigNames.size()}"
      .config="${slot.size}"
      @update="${this.updateSlot}"
    ></slot-size-input>`;
  }

  private renderTargetingInput(slot: SampleSlotConfig) {
    return html` <targeting-input
      title="${slotSettingsConfigNames.targeting()}"
      .config="${slot.config?.targeting || []}"
      @update="${this.updateSlot}"
    ></targeting-input>`;
  }

  private renderAdExclusionInput(slot: SampleSlotConfig) {
    return html`<ad-exclusion-input
      title="${slotSettingsConfigNames.categoryExclusion()}"
      .config="${slot.config?.categoryExclusion || []}"
      @update="${this.updateSlot}"
    ></ad-exclusion-input>`;
  }

  private renderSlotSettings(slot: SampleSlotConfig) {
    return html`
      ${this.renderSlotOptions(slot)}
      ${when(slot.format && slot.format === 'INTERSTITIAL', () =>
        this.renderInterstitialSlotSettings(slot),
      )}
      ${when(!slot.format, () => this.renderSlotSizeInput(slot))}
      ${this.renderTargetingInput(slot)} ${this.renderAdExclusionInput(slot)}
    `;
  }

  private renderSlot(slot: KeyedSlot, index: number) {
    return html`<div class="slot">
      <span class="slot-id">${index + 1}</span>
      ${this.renderSlotTemplates(slot.slot)}
      <configurator-icon-button
        class="slot-delete"
        icon="delete"
        title="${strings.removeSlotTitle()}"
        @click="${this.removeSlot}"
      ></configurator-icon-button>
      <div
        class="${classMap({
          'slot-settings': true,
          hidden: slot.template,
        })}"
      >
        ${this.renderSlotSettings(slot.slot)}
      </div>
    </div>`;
  }

  render() {
    const slots: TemplateResult[] = [];
    this.dirtyConfig.forEach((slot, i) => {
      slots.push(this.renderSlot(slot, i));
    });

    return html`
      <config-section title="${configNames.slots()}">
        ${slots}
        <configurator-icon-button
          class="add-slot"
          icon="add"
          title="${strings.addSlotTitle()}"
          @click="${this.addSlot}"
        ></configurator-icon-button>
      </config-section>
    `;
  }
}
