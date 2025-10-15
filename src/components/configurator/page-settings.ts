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

import '../ui-controls/ad-exclusion-input';
import '../ui-controls/config-section';
import '../ui-controls/configurator-checkbox';
import '../ui-controls/configurator-format-select';
import '../ui-controls/configurator-select';
import '../ui-controls/configurator-slider';
import '../ui-controls/configurator-text-field';
import '../ui-controls/inheritable-checkbox';
import '../ui-controls/targeting-input';

import {localized, msg} from '@lit/localize';
import {html, LitElement} from 'lit';
import {customElement, property, query, queryAll} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';

import {
  SamplePageConfig,
  SamplePrivacyConfig,
} from '../../model/sample-config.js';
import {
  adSenseAttributesConfigNames,
  collapseDivNames,
  configNames,
  lazyLoadConfigNames,
  pageConfigNames,
  pageSettingsConfigNames,
  privacyConfigNames,
  privacyTreatmentNames,
  safeFrameConfigNames,
} from '../../model/settings.js';
import {AdExclusionInput} from '../ui-controls/ad-exclusion-input.js';
import {
  ConfiguratorSelect,
  ConfiguratorSelectOption,
} from '../ui-controls/configurator-select.js';
import {ConfiguratorSlider} from '../ui-controls/configurator-slider.js';
import {ConfiguratorTextField} from '../ui-controls/configurator-text-field.js';
import {InheritableCheckbox} from '../ui-controls/inheritable-checkbox.js';
import {TargetingInput} from '../ui-controls/targeting-input.js';

const strings = {
  validationErrorPageUrl: () =>
    msg('Please specify a valid URL.', {desc: 'Validation error.'}),
};

// Page URL validation
const URL_PROTOCOL_PATTERN = 'https?:\\/\\/';
const URL_DOMAIN_PATTERN = '[A-Za-z\\d\\.\\-]';
const URL_TLD_PATTERN = '\\.[A-Za-z]{2,}';
const URL_PATH_PATTERN = '\\/[\\w\\d\\(\\)@:%\\+\\.~#?&\\/=]*';
const PAGE_URL_VALIDATION_PATTERN = `${URL_PROTOCOL_PATTERN}(${
  URL_DOMAIN_PATTERN
})+(${URL_TLD_PATTERN})+(${URL_PATH_PATTERN})?`;
const PAGE_URL_VALIDATION_REGEX = new RegExp(
  `^${PAGE_URL_VALIDATION_PATTERN}$`,
);

/**
 * Page-level configurator settings.
 */
@localized()
@customElement('page-settings')
export class PageSettings extends LitElement {
  @query('configurator-checkbox#disableInitialLoad')
  private disableInitialLoadInput!: HTMLInputElement;
  @query('configurator-checkbox#sra') private sraInput!: HTMLInputElement;
  @query('inheritable-checkbox#forceSafeFrame')
  private forceSafeFrame!: InheritableCheckbox;
  @query('configurator-select#collapseDiv')
  private collapseDivSelect!: ConfiguratorSelect;
  @query('configurator-text-field#pageUrl')
  private pageUrl!: ConfiguratorTextField;
  @queryAll('.privacy configurator-checkbox')
  private privacySettings!: HTMLInputElement[];
  @queryAll('.privacy .treatments configurator-checkbox')
  private privacyTreatments!: HTMLInputElement[];
  @query('targeting-input') private targetingInput!: TargetingInput;
  @query('ad-exclusion-input') private exclusionInput!: AdExclusionInput;
  @query('configurator-slider#fetchMargin')
  private fetchMarginInput!: ConfiguratorSlider;
  @query('configurator-slider#renderMargin')
  private renderMarginInput!: ConfiguratorSlider;
  @query('configurator-slider#mobileScaling')
  private mobileScalingInput!: ConfiguratorSlider;

  /**
   * Gets the active page-level configuration.
   */
  @property({attribute: 'config', type: Object}) config: SamplePageConfig = {};

  private handleUpdate() {
    this.config.privacy = this.config.privacy || {};
    this.privacySettings.forEach(input => {
      this.config.privacy![input.id as keyof SamplePrivacyConfig] =
        input.checked;
    });

    // Populate page-level config.
    const pageConfig: googletag.config.PageSettingsConfig = {};
    pageConfig.disableInitialLoad =
      this.disableInitialLoadInput.checked || undefined;
    pageConfig.singleRequest = this.sraInput.checked || undefined;
    pageConfig.collapseDiv =
      (this.collapseDivSelect.value as googletag.config.CollapseDivBehavior) ||
      undefined;

    pageConfig.safeFrame = pageConfig.safeFrame || {};
    pageConfig.safeFrame.forceSafeFrame =
      this.forceSafeFrame.checked || undefined;

    pageConfig.adsenseAttributes = pageConfig.adsenseAttributes || {};
    pageConfig.adsenseAttributes.page_url = PAGE_URL_VALIDATION_REGEX.test(
      this.pageUrl.value,
    )
      ? this.pageUrl.value
      : undefined;

    pageConfig.targeting = this.targetingInput.config;

    const exclusions = this.exclusionInput.config;
    pageConfig.categoryExclusion =
      exclusions.length > 0 ? exclusions : undefined;

    const treatments: googletag.config.PrivacyTreatment[] = [];
    this.privacyTreatments.forEach(input => {
      if (input.checked) {
        treatments.push(input.id as googletag.config.PrivacyTreatment);
      }
    });

    pageConfig.privacyTreatments =
      treatments.length > 0 ? {treatments: treatments} : undefined;

    const fetchMargin = this.fetchMarginInput.value;
    const renderMargin = this.renderMarginInput.value;
    const mobileScaling = this.mobileScalingInput.value;
    pageConfig.lazyLoad =
      fetchMargin || renderMargin || mobileScaling > 1
        ? {
            fetchMarginPercent: fetchMargin || undefined,
            renderMarginPercent: renderMargin || undefined,
            mobileScaling: mobileScaling > 1 ? mobileScaling : undefined,
          }
        : undefined;

    if (Object.keys(pageConfig).length > 0) {
      this.config.config = pageConfig;
    }

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  private renderCheckbox(
    id: string,
    label: string,
    checked = false,
    inheritable = false,
  ) {
    return inheritable
      ? html`<inheritable-checkbox
          id="${id}"
          inheritanceKey="${id}"
          label="${label}"
          value="${checked}"
          @update="${this.handleUpdate}"
        ></inheritable-checkbox>`
      : html`<configurator-checkbox
          id="${id}"
          label="${label}"
          ?checked="${checked}"
          @update="${this.handleUpdate}"
        ></configurator-checkbox>`;
  }

  private renderGeneralSettings() {
    const collapseDivOptions: ConfiguratorSelectOption[] = [
      {
        label: collapseDivNames.DISABLED(),
        selected:
          !this.config.config?.collapseDiv ||
          this.config.config?.collapseDiv === 'DISABLED',
        value: '',
      },
    ];

    Object.entries(collapseDivNames)
      .filter(([k]) => k !== 'DISABLED')
      .forEach(([k, v]) => {
        collapseDivOptions.push({
          label: v(),
          value: k,
          selected: this.config.config?.collapseDiv === k,
        });
      });

    return html`
      ${this.renderCheckbox(
        'disableInitialLoad',
        pageSettingsConfigNames.disableInitialLoad(),
        this.config.config?.disableInitialLoad || undefined,
      )}
      ${this.renderCheckbox(
        'sra',
        pageSettingsConfigNames.singleRequest(),
        this.config.config?.singleRequest || undefined,
      )}
      ${this.renderCheckbox(
        'forceSafeFrame',
        safeFrameConfigNames.forceSafeFrame(),
        this.config.config?.safeFrame?.forceSafeFrame || undefined,
        true,
      )}
      <configurator-select
        id="collapseDiv"
        label="${pageSettingsConfigNames.collapseDiv()}"
        .options="${collapseDivOptions}"
        @update="${this.handleUpdate}"
      ></configurator-select>
      <configurator-text-field
        id="pageUrl"
        label="${adSenseAttributesConfigNames.page_url()}"
        error-text="${strings.validationErrorPageUrl()}"
        pattern="${PAGE_URL_VALIDATION_PATTERN}"
        placeholder="https://www.example.com"
        value="${ifDefined(
          this.config.config?.adsenseAttributes?.page_url || undefined,
        )}"
        @update="${this.handleUpdate}"
      ></configurator-text-field>
    `;
  }

  private renderPrivacySettings() {
    const privacy = this.config.privacy || {};
    const treatment = this.config.config?.privacyTreatments || {treatments: []};

    return html`<config-section
      class="privacy"
      nested
      title="${pageConfigNames.privacy!()}"
    >
      ${Object.keys(privacyConfigNames).map((setting: string) => {
        const key = setting as keyof SamplePrivacyConfig;
        return this.renderCheckbox(
          key,
          privacyConfigNames[key](),
          privacy[key],
        );
      })}

      <config-section
        class="treatments"
        nested
        title="${pageSettingsConfigNames.privacyTreatments()}"
      >
        ${Object.keys(privacyTreatmentNames).map((setting: string) => {
          const key = setting as googletag.config.PrivacyTreatment;
          return this.renderCheckbox(
            key,
            privacyTreatmentNames[key](),
            treatment.treatments?.includes(key),
          );
        })}
      </config-section>
    </config-section>`;
  }

  private renderPageTargeting() {
    return html`<targeting-input
      class="page"
      title="${pageSettingsConfigNames.targeting()}"
      .config="${this.config.config?.targeting || []}"
      @update="${this.handleUpdate}"
    >
    </targeting-input>`;
  }

  private renderLazyLoading() {
    return html`<config-section
      id="lazyload"
      title="${pageSettingsConfigNames.lazyLoad()}"
      nested
    >
      <configurator-slider
        id="fetchMargin"
        label="${lazyLoadConfigNames.fetchMarginPercent()}"
        value="${this.config.config?.lazyLoad?.fetchMarginPercent || 0}"
        min="0"
        max="500"
        step="50"
        @update="${this.handleUpdate}"
        labeled
      ></configurator-slider>
      <configurator-slider
        id="renderMargin"
        label="${lazyLoadConfigNames.renderMarginPercent()}"
        value="${this.config.config?.lazyLoad?.renderMarginPercent || 0}"
        min="0"
        max="500"
        step="50"
        @update="${this.handleUpdate}"
        labeled
      ></configurator-slider>
      <configurator-slider
        id="mobileScaling"
        label="${lazyLoadConfigNames.mobileScaling()}"
        value="${this.config.config?.lazyLoad?.mobileScaling || 1}"
        min="1"
        max="5"
        step="0.5"
        @update="${this.handleUpdate}"
        labeled
      ></configurator-slider>
    </config-section>`;
  }

  private renderAdExclusions() {
    return html`<ad-exclusion-input
      class="exclusions"
      title="${pageSettingsConfigNames.categoryExclusion()}"
      .config="${this.config.config?.categoryExclusion || []}"
      @update="${this.handleUpdate}"
    ></ad-exclusion-input>`;
  }

  render() {
    return html`<config-section title="${configNames.page!()}">
      ${this.renderGeneralSettings()} ${this.renderPrivacySettings()}
      ${this.renderPageTargeting()} ${this.renderLazyLoading()}
      ${this.renderAdExclusions()}
    </config-section>`;
  }
}
