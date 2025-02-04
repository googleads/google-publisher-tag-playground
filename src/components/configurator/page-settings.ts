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
import '../ui-controls/targeting-input';

import {localized} from '@lit/localize';
import {html, LitElement} from 'lit';
import {customElement, property, query, queryAll} from 'lit/decorators.js';

import {
  SamplePageConfig,
  SamplePrivacyConfig,
} from '../../model/sample-config.js';
import {
  configNames,
  pageConfigNames,
  privacyConfigNames,
} from '../../model/settings.js';
import {TargetingInput} from '../ui-controls/targeting-input.js';

/**
 * Page-level configurator settings.
 */
@localized()
@customElement('page-settings')
export class PageSettings extends LitElement {
  @query('configurator-checkbox#sra') private sraInput!: HTMLInputElement;
  @queryAll('.privacy configurator-checkbox')
  private privacySettings!: HTMLInputElement[];
  @query('targeting-input') private targetingInput!: TargetingInput;

  /**
   * Gets the active page-level configuration.
   */
  @property({attribute: 'config', type: Object}) config: SamplePageConfig = {};

  private handleUpdate() {
    this.config.sra = this.sraInput.checked;

    this.config.privacy = this.config.privacy || {};
    this.privacySettings.forEach(input => {
      this.config.privacy![input.id as keyof SamplePrivacyConfig] =
        input.checked;
    });

    this.config.targeting = this.targetingInput.config;

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
    return this.renderCheckbox('sra', pageConfigNames.sra!(), this.config.sra);
  }

  private renderPrivacySettings() {
    const privacy = this.config.privacy || {};
    return html`<config-section
      class="privacy"
      nested
      title="${pageConfigNames.privacy!()}"
    >
      ${Object.keys(privacyConfigNames).map((setting: string) => {
        const key = setting as keyof SamplePrivacyConfig;
        return this.renderCheckbox(
          key,
          privacyConfigNames[key]!(),
          privacy[key],
        );
      })}
    </config-section>`;
  }

  private renderPageTargeting() {
    return html`<targeting-input
      class="page"
      title="${pageConfigNames.targeting!()}"
      .config="${this.config.targeting || []}"
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
