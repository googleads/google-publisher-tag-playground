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

import '../ui-controls/config-section';
import '../ui-controls/configurator-checkbox';
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
  adSenseAttributeConfigNames,
  configNames,
  pageConfigNames,
  privacyConfigNames,
  privacyTreatmentConfigNames,
  privacyTreatmentNames,
} from '../../model/settings.js';
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
  @query('configurator-checkbox#sra') private sraInput!: HTMLInputElement;
  @queryAll('.privacy configurator-checkbox')
  private privacySettings!: HTMLInputElement[];
  @queryAll('.privacy .treatments configurator-checkbox')
  private privacyTreatments!: HTMLInputElement[];
  @query('targeting-input') private targetingInput!: TargetingInput;
  @query('configurator-text-field#pageUrl')
  private pageUrl!: ConfiguratorTextField;

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
    pageConfig.singleRequest = this.sraInput.checked || undefined;

    pageConfig.adsenseAttributes = pageConfig.adsenseAttributes || {};
    pageConfig.adsenseAttributes.page_url = PAGE_URL_VALIDATION_REGEX.test(
      this.pageUrl.value,
    )
      ? this.pageUrl.value
      : undefined;

    pageConfig.targeting = this.targetingInput.config;

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
    return html`
      ${this.renderCheckbox(
        'sra',
        pageConfigNames.sra!(),
        this.config.config?.singleRequest || undefined,
      )}
      <configurator-text-field
        id="pageUrl"
        label="${adSenseAttributeConfigNames.pageUrl()}"
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
        title="${privacyTreatmentConfigNames.treatments()}"
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
      title="${pageConfigNames.targeting!()}"
      .config="${this.config.config?.targeting || []}"
      @update="${this.handleUpdate}"
    >
    </targeting-input>`;
  }

  render() {
    return html`<config-section title="${configNames.page!()}">
      ${this.renderGeneralSettings()} ${this.renderPrivacySettings()}
      ${this.renderPageTargeting()}
    </config-section>`;
  }
}
