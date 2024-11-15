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
import './targeting-input';
import './slot-input';

import {localized, msg} from '@lit/localize';
import {css, html, LitElement, TemplateResult} from 'lit';
import {until} from 'lit-html/directives/until.js';
import {customElement, property, query, state} from 'lit/decorators.js';
import {debounce} from 'lodash-es';
import ts from 'typescript';

import * as base64url from '../../src/util/base64url.js';
import * as urlHash from '../../src/util/url-hash.js';
import type {SampleConfig} from '../model/sample-config.js';
import {
  configNames,
  pageConfigNames,
  privacyConfigNames,
  templateConfigNames,
} from '../model/settings.js';
import {createTemplate} from '../template/template-factory.js';
import {Template} from '../template/template.js';

import {GptPlayground} from './gpt-playground.js';
import {SlotInput} from './slot-input.js';
import {TargetingInput} from './targeting-input.js';

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
  @query('targeting-input.page') private pageTargetingInput!: TargetingInput;
  @query('slot-input') private slotInput!: SlotInput;

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

    fieldset {
      display: flex;
      flex-flow: row wrap;
    }

    fieldset > fieldset,
    fieldset > targeting-input {
      margin: 15px 0 0;
    }

    fieldset label {
      display: block;
    }

    fieldset input[type='checkbox'] {
      float: left;
    }

    fieldset select {
      float: right;
    }

    fieldset.page div,
    fieldset.privacy div {
      width: 33%;
      min-width: 200px;
    }

    fieldset.template div {
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

  private getInputById(id: string): HTMLInputElement {
    return this.renderRoot.querySelector(`#${id}`) as HTMLInputElement;
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

  private updateBooleanSettings(e: Event) {
    const config = structuredClone(this.config);

    // Ensure relevant configs are defined.
    config.page = config.page || {};
    config.page.privacy = config.page.privacy || {};

    // Update page settings.
    const page = config.page;
    page.sra = this.getInputById('sra').checked;

    // Update privacy settings.
    const privacy = config.page.privacy;
    privacy.ltd = this.getInputById('ltd').checked;
    privacy.npa = this.getInputById('npa').checked;
    privacy.rdp = this.getInputById('rdp').checked;
    privacy.tfcd = this.getInputById('tfcd').checked;
    privacy.tfua = this.getInputById('tfua').checked;

    this.config = config;
  }

  private updateStringSettings(e: Event) {
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

  private updatePageTargeting(e: Event) {
    const config = structuredClone(this.config);

    // Ensure relevant configs are defined.
    config.page = config.page || {};
    config.page.targeting = this.pageTargetingInput.config;

    this.config = config;
  }

  private updateSlotSettings(e: Event) {
    const config = structuredClone(this.config);

    // Ensure relevant configs are defined.
    config.slots = config.slots || [];
    config.slots = this.slotInput.config;

    this.config = config;
  }

  private checkbox(setting: string, name: string, enabled = false) {
    return html` <div>
      <input
        type="checkbox"
        id="${setting}"
        ?checked="${enabled}"
        @click="${this.updateBooleanSettings}"
      />
      <label for="${setting}">${name}</label>
    </div>`;
  }

  private renderPageSettings() {
    const settings = this.config?.page;

    return html` <fieldset class="page">
      <legend>${configNames.page!()}</legend>
      ${this.checkbox('sra', pageConfigNames.sra!(), settings?.sra)}
      ${this.renderPrivacySettings()}
      <targeting-input
        class="page"
        .config="${settings?.targeting}"
        title="${pageConfigNames.targeting!()}"
        @update="${this.updatePageTargeting}"
      >
      </targeting-input>
    </fieldset>`;
  }

  private renderPrivacySettings() {
    const settings = this.config?.page?.privacy;

    return html` <fieldset class="privacy">
      <legend>${pageConfigNames.privacy!()}</legend>
      ${this.checkbox('tfcd', privacyConfigNames.tfcd!(), settings?.tfcd)}
      ${this.checkbox('ltd', privacyConfigNames.ltd!(), settings?.ltd)}
      ${this.checkbox('npa', privacyConfigNames.npa!(), settings?.npa)}
      ${this.checkbox('rdp', privacyConfigNames.rdp!(), settings?.rdp)}
      ${this.checkbox('tfua', privacyConfigNames.tfua!(), settings?.tfua)}
    </fieldset>`;
  }

  private renderSlotSettings() {
    return html` <slot-input
      title="${configNames.slots()}"
      .config="${this.config?.slots}"
      @update="${this.updateSlotSettings}"
    >
    </slot-input>`;
  }

  private renderTemplateSettings() {
    const settings = this.config?.template;

    const jsTargets: TemplateResult[] = [];
    Object.entries(ts.ScriptTarget)
      .filter(([k, v]) => isNaN(Number(k)) && !['ES3', 'JSON'].includes(k))
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

    return html` <fieldset class="template">
      <legend>${configNames.template!()}</legend>
      <div>
        <select id="target" name="target" @change=${this.updateStringSettings}>
          <option value="">TypeScript</option>
          ${jsTargets}
        </select>
        <label for="target">${templateConfigNames.target!()}</label>
      </div>
    </fieldset>`;
  }

  private renderConfigurator() {
    return html` <div id="configurator">
      <div id="configurator-header">
        <span>Sample configuration</span>
      </div>
      <div id="configurator-settings">
        ${this.renderPageSettings()} ${this.renderSlotSettings()}
        ${this.renderTemplateSettings()}
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
