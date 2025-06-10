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
import './ui-controls/resizable-area';
import './configurator/output-settings';
import './configurator/page-settings';
import './configurator/slot-settings';

import {localized} from '@lit/localize';
import {css, html, LitElement} from 'lit';
import {until} from 'lit-html/directives/until.js';
import {customElement, property, query, state} from 'lit/decorators.js';
import {debounce} from 'lodash-es';

import * as base64url from '../../src/util/base64url.js';
import {consentSignal} from '../model/consent.js';
import type {SampleConfig} from '../model/sample-config.js';
import {window} from '../model/window.js';
import {createTemplate} from '../template/template-factory.js';
import {Template} from '../template/template.js';
import {PlaygroundConfig} from '../util/playground-config.js';

import {OutputSettings} from './configurator/output-settings.js';
import {PageSettings} from './configurator/page-settings.js';
import {SlotSettings} from './configurator/slot-settings.js';
import {GptPlayground} from './gpt-playground.js';
import {fontStyles} from './styles/fonts.js';
import {materialStyles} from './styles/material-theme.js';

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
  @query('output-settings') private outputSettings!: OutputSettings;
  @query('page-settings') private pageSettings!: PageSettings;
  @query('slot-settings') private slotSettings!: SlotSettings;

  static styles = [
    fontStyles,
    materialStyles,
    css`
      :host {
        display: flex;
        height: 100%;
      }

      #configurator {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: white;
        min-width: 300px;
      }

      #configurator-settings {
        flex: 1 1 0%;
        max-height: 100%;
        overflow: scroll;
      }
    `,
  ];

  @property({attribute: 'config', type: Object})
  set config(config: SampleConfig) {
    this.internalConfig = config;

    const template = createTemplate(config);
    // TODO: pass in consent state.
    // console.log(`Consent state: ${JSON.stringify(consentSignal.get())}`);

    this.template = template;
  }

  get config() {
    return this.internalConfig;
  }

  constructor() {
    super();
    this.template = createTemplate(this.config);

    // Enable consent.
    consentSignal.get().enabled = true;
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

    // Update playground config state.
    PlaygroundConfig.sampleConfigHash = configHash;

    if (window.parent) {
      // Post a message to the parent window with the current config state.
      window.parent.postMessage(configHash, '*');
    }

    // Update the preview window, if one is open.
    const previewWindow = this.playground.previewWindow;
    if (previewWindow) {
      previewWindow.location = this.playground.generatePreviewUrl();
    }
  }

  private updateSettings() {
    const config = structuredClone(this.config);

    // Ensure relevant configs are defined.
    config.page = config.page || {};
    config.page.privacy = config.page.privacy || {};
    config.slots = config.slots || [];
    config.template = config.template || {};

    config.page = this.pageSettings.config;
    config.slots = this.slotSettings.config;
    config.template = this.outputSettings.config;

    this.config = config;
  }

  private renderConfigurator() {
    return html` <div id="configurator" slot="primary">
      <div id="configurator-settings">
        <page-settings
          .config="${this.config?.page || {}}"
          @update="${this.updateSettings}"
        ></page-settings>
        <slot-settings
          .config="${this.config?.slots}"
          @update="${this.updateSettings}"
        ></slot-settings>
        <output-settings
          .config="${this.config?.template || {}}"
          @update="${this.updateSettings}"
        ></output-settings>
      </div>
    </div>`;
  }

  render() {
    return html`<resizable-area primary-percent="33">
      ${this.renderConfigurator()}
      <gpt-playground
        .config="${until(this.template?.playgroundConfig(), null)}"
        ?preview-enabled=${this.isPreviewable()}
        slot="secondary"
        @consentChanged="${this.updateSettings}"
        readonly
        vertical
      ></gpt-playground>
    </resizable-area>`;
  }

  updated() {
    // Update serialized configurator state.
    this.updateConfigState();

    // Update the preview panel state.
    this.updatePreview();
  }
}
