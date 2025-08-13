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
import '../ui-controls/configurator-text-field';
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
  pageConfigNames,
  pageSettingsConfigNames,
  privacyConfigNames,
  privacyTreatmentNames,
} from '../../model/settings.js';
import {AdExclusionInput} from '../ui-controls/ad-exclusion-input.js';
import {
  ConfiguratorSelect,
  ConfiguratorSelectOption,
} from '../ui-controls/configurator-select.js';
import {ConfiguratorTextField} from '../ui-controls/configurator-text-field.js';
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

    if (Object.keys(pageConfig).length > 0) {
      this.config.config = pageConfig;
    }

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  private renderCheckbox(id: string, label: string, checked = false) {
    return html`<configurator-checkbox
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
      ${this.renderPageTargeting()} ${this.renderAdExclusions()}
    </config-section>`;
  }
}
