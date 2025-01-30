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

import './gpt-playground';
import './configurator/page-settings';
import './configurator/slot-settings';
import './ui-controls/config-section';

import {localized, msg} from '@lit/localize';
import {css, html, LitElement, TemplateResult} from 'lit';
import {until} from 'lit-html/directives/until.js';
import {customElement, property, query, state} from 'lit/decorators.js';
import {debounce} from 'lodash-es';
import ts from 'typescript';

import * as base64url from '../../src/util/base64url.js';
import * as urlHash from '../../src/util/url-hash.js';
import type {SampleConfig} from '../model/sample-config.js';
import {configNames, templateConfigNames} from '../model/settings.js';
import {createTemplate} from '../template/template-factory.js';
import {Template} from '../template/template.js';

import {PageSettings} from './configurator/page-settings.js';
import {SlotSettings} from './configurator/slot-settings.js';
import {GptPlayground} from './gpt-playground.js';

// Constant UI strings.
const strings = {
  configuratorTitle: () =>
    msg('Sample configuration', {
      desc: 'Section containing configurable sample options.',
    }),
};

/**
 * Custom GPT sample configurator component.
 */
@localized()
@customElement('sample-configurator')
export class SampleConfigurator extends LitElement {
  private internalConfig: SampleConfig = {slots: []};
  private updateConfigState = debounce(this.updateConfigStateInternal, 100);

  @state() private template: Template;
  @query('gpt-playground') private playground!: GptPlayground;
  @query('slot-settings') private slotSettings!: SlotSettings;
  @query('page-settings') private pageSettings!: PageSettings;

  static styles = css`
    :host {
      display: flex;
      height: 100%;
    }

    #configurator {
      display: flex;
      flex-direction: column;
      width: var(--configurator-width, 33%);
      background-color: var(--playground-tab-bar-background, #eaeaea);
    }

    #configurator-header {
      align-items: center;
      display: flex;
      flex: 0 0 var(--playground-bar-height, 40px);
      padding: 0 8px 0;
      border-bottom: var(--playground-border, solid 1px #ddd);
    }

    #configurator-settings {
      flex: 1 1 0%;
      max-height: 100%;
      padding: 0 8px 8px;
      overflow: scroll;
    }

    config-section select {
      float: right;
    }

    config-section.template div {
      width: 50%;
      min-width: 200px;
    }
  `;

  @property({attribute: 'config', type: Object})
  set config(config: SampleConfig) {
    this.internalConfig = config;
    this.template = createTemplate(config);
  }

  get config() {
    return this.internalConfig;
  }

  constructor() {
    super();
    this.template = createTemplate(this.config);
  }

  private getSelectById(id: string): HTMLSelectElement {
    return this.renderRoot.querySelector(`#${id}`) as HTMLSelectElement;
  }

  private isPreviewable() {
    // Out-of-page slots won't work in the embedded preview iframe.
    return !this.config.slots?.some(slot => slot.format);
  }

  private updatePreview() {
    if (this.isPreviewable()) {
      this.playground.enablePreview();
    } else {
      this.playground.disablePreview();
    }
  }

  private updateConfigStateInternal() {
    const configHash = base64url.encode(JSON.stringify(this.config));

    // Update the window URL with the current config state.
    urlHash.setParameter('config', configHash);

    if (window.parent) {
      // Post a message to the parent window with the current config state.
      window.parent.postMessage(configHash, '*');
    }

    // Update the preview window, if one is open.
    const previewWindow = this.playground.previewWindow;
    if (previewWindow) {
      urlHash.setParameter('config', configHash, previewWindow.history);
      previewWindow.location.reload();
    }
  }

  private updateStringSettings() {
    const config = structuredClone(this.config);

    // Ensure relevant configs are defined.
    config.template = config.template || {};

    // Update template settings.
    const template = config.template;
    const target = this.getSelectById('target').value;
    template.target =
      target.length > 0
        ? ts.ScriptTarget[target as keyof typeof ts.ScriptTarget]
        : undefined;

    this.config = config;
  }

  private updateSettings() {
    const config = structuredClone(this.config);

    // Ensure relevant configs are defined.
    config.page = config.page || {};
    config.page.privacy = config.page.privacy || {};
    config.slots = config.slots || [];

    config.page = this.pageSettings.config;
    config.slots = this.slotSettings.config;

    this.config = config;
  }

  private renderSlotSettings() {
    return html` <slot-settings
      title="${configNames.slots()}"
      .config="${this.config?.slots}"
      @update="${this.updateSettings}"
    >
    </slot-settings>`;
  }

  private renderTemplateSettings() {
    const settings = this.config?.template;

    const jsTargets: TemplateResult[] = [];
    Object.entries(ts.ScriptTarget)
      .filter(([k]) => isNaN(Number(k)) && !['ES3', 'JSON'].includes(k))
      .forEach(([k, v]) => {
        jsTargets.push(
          html`<option
            value="${k}"
            ?selected="${settings && settings.target === v}"
          >
            JavaScript (${k})
          </option>`,
        );
      });

    return html`<config-section
      class="template"
      title="${configNames.template!()}"
    >
      <div>
        <select id="target" name="target" @change=${this.updateStringSettings}>
          <option value="">TypeScript</option>
          ${jsTargets}
        </select>
        <label for="target">${templateConfigNames.target!()}</label>
      </div>
    </config-section>`;
  }

  private renderConfigurator() {
    return html` <div id="configurator">
      <div id="configurator-header">
        <span>${strings.configuratorTitle()}</span>
      </div>
      <div id="configurator-settings">
        <page-settings
          .config="${this.config?.page || {}}"
          @update="${this.updateSettings}"
        ></page-settings>
        ${this.renderSlotSettings()} ${this.renderTemplateSettings()}
      </div>
    </div>`;
  }

  render() {
    return html` ${this.renderConfigurator()}
      <gpt-playground
        .config="${until(this.template?.playgroundConfig(), null)}"
        ?preview-enabled=${this.isPreviewable()}
        readonly
        vertical
      >
      </gpt-playground>`;
  }

  updated() {
    // Update serialized configurator state.
    this.updateConfigState();

    // Update the preview panel state.
    this.updatePreview();
  }
}
