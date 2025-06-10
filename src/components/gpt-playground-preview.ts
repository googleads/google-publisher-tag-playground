/**
 * Copyright 2025 Google LLC
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

import './ui-controls/configurator-icon-button';
import 'playground-elements/playground-preview';

import {TCData} from '@iabtechlabtcf/cmpapi';
import {html, SignalWatcher} from '@lit-labs/signals';
import {localized, msg} from '@lit/localize';
import {css, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {when} from 'lit/directives/when.js';
import type {PlaygroundPreview} from 'playground-elements/playground-preview.js';
import type {PlaygroundProject} from 'playground-elements/playground-project.js';

import {consentSignal} from '../model/consent.js';
import {PlaygroundConfig} from '../util/playground-config.js';

import {fontStyles} from './styles/fonts.js';
import {ConfiguratorCheckbox} from './ui-controls/configurator-checkbox.js';

// Constant UI strings.
const strings = {
  consentLabel: () =>
    msg('EU user consent', {
      desc: 'Label for control that enables/disables GDPR consent',
    }),
  previewToolbarLabel: () => msg('Preview', {desc: 'Preview toolbar label'}),
  refreshButton: () => msg('Refresh preview', {desc: 'Button text'}),
};

@localized()
@customElement('gpt-playground-preview')
export class GptPlaygroundPreview extends SignalWatcher(LitElement) {
  @query('configurator-checkbox#consent')
  consentCheckbox!: ConfiguratorCheckbox;

  static styles = [
    fontStyles,
    css`
      :host {
        display: grid;
        font: var(--standard-font);
        height: 100%;
        grid-template-rows: min-content auto;
      }

      playground-preview::part(preview-toolbar) {
        display: none;
      }

      .toolbar {
        align-items: center;
        background-color: var(--playground-preview-toolbar-background, #ffffff);
        border-bottom: 1px solid var(--playground-border, #dddddd);
        color: var(--playground-preview-toolbar-foreground-color, #444444);
        display: grid;
        grid-template-areas: 'label controls actions';
        grid-template-columns: min-content auto min-content;
        min-height: 40px;
        padding: 0 8px;
      }

      .toolbar-actions {
        grid-area: actions;
        justify-self: end;
      }

      .toolbar-controls {
        grid-area: controls;
        justify-items: end;
      }

      .toolbar-label {
        grid-area: label;
      }

      configurator-checkbox {
        width: min-content;
      }

      playground-preview {
        display: block;
        height: unset;
      }
    `,
  ];

  /**
   * The {@link PlaygroundProject} this preview is connected to.
   */
  @property({attribute: 'project', type: Object}) project?: PlaygroundProject;

  /**
   * A refrence to the {@link PlaygroundPreview} encapsulated by this
   * component.
   */
  @query('playground-preview') private playgroundPreview!: PlaygroundPreview;

  private refreshPreview() {
    this.playgroundPreview?.reload();
  }

  private maybeLaunchConsentWorkflow(event: Event) {
    if (this.consentCheckbox.checked) return;

    // Going from unchecked to checked, so launch the consent workflow.
    const consentPath = `consent#hl=${PlaygroundConfig.locale}`;
    window.open(`${PlaygroundConfig.baseUrl}/${consentPath}`, 'gpt-consent');

    // Control should only become checked if the consent workflow succeeds,
    // so stop the click event from propagating for now.
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  private updateConsentData(data?: TCData) {
    const consentData = structuredClone(consentSignal.get());
    consentData.data = data;
    consentSignal.set(consentData);

    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('consentChanged', {bubbles: true, composed: true}),
    );
  }

  private renderConsentControl() {
    return html`
      <configurator-checkbox
        id="consent"
        label="${strings.consentLabel()}"
        ?checked="${!!consentSignal.get().data}"
        @click="${this.maybeLaunchConsentWorkflow}"
        @update="${() => {
          // This handler is only called going from checked to unchecked.
          this.updateConsentData();
        }}"
      ></configurator-checkbox>
    `;
  }

  render() {
    return html`
      <div class="toolbar" part="toolbar">
        <span class="toolbar-label">${strings.previewToolbarLabel()}</span>
        <div class="toolbar-actions">
          <configurator-icon-button
            icon="refresh"
            title="${strings.refreshButton()}"
            @click="${this.refreshPreview}"
          >
          </configurator-icon-button>
        </div>
        <div class="toolbar-controls">
          ${when(consentSignal.get().enabled, () =>
            this.renderConsentControl(),
          )}
        </div>
      </div>
      <playground-preview .project=${this.project}></playground-preview>
    `;
  }

  firstUpdated() {
    // Register post message handler for consent callback.
    window.addEventListener('message', (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source !== window.window
      ) {
        try {
          const data = event.data as TCData;
          if ('tcString' in data) {
            this.updateConsentData(data);
          }
        } catch (e) {
          // Ignored.
        }
      }
    });
  }
}
