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
import '../ui-controls/configurator-select';

import {localized} from '@lit/localize';
import {html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import ts from 'typescript';

import {SampleTemplateConfig} from '../../model/sample-config.js';
import {configNames, templateConfigNames} from '../../model/settings.js';
import {
  ConfiguratorOption,
  ConfiguratorSelect,
} from '../ui-controls/configurator-select.js';

/**
 * Output template configurator settings.
 */
@localized()
@customElement('output-settings')
export class OutputSettings extends LitElement {
  @query('configurator-select#target')
  private targetSelect!: ConfiguratorSelect;

  /**
   * Gets the active page-level configuration.
   */
  @property({attribute: 'config', type: Object})
  config: SampleTemplateConfig = {};

  private handleUpdate() {
    const target = this.targetSelect.value;
    this.config.target =
      target && target.length > 0
        ? ts.ScriptTarget[target as keyof typeof ts.ScriptTarget]
        : undefined;

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  private renderGeneralSettings() {
    const options: ConfiguratorOption[] = [
      {
        label: 'TypeScript',
        value: '',
        selected: !this.config.target,
      },
    ];

    Object.entries(ts.ScriptTarget)
      .filter(([k]) => isNaN(Number(k)) && !['ES3', 'JSON'].includes(k))
      .forEach(([k, v]) => {
        options.push({
          label: `JavaScript (${k})`,
          value: k,
          selected: this.config.target === v,
        });
      });

    return html`<configurator-select
      id="target"
      label="${templateConfigNames.target!()}"
      .options="${options}"
      @update="${this.handleUpdate}"
    ></configurator-select>`;
  }

  render() {
    return html`<config-section
      class="template"
      title="${configNames.template!()}"
    >
      ${this.renderGeneralSettings()}
    </config-section>`;
  }
}
