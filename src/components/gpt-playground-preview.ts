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

import {localized, msg} from '@lit/localize';
import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import type {PlaygroundPreview} from 'playground-elements/playground-preview.js';
import type {PlaygroundProject} from 'playground-elements/playground-project.js';

import {fontStyles} from './styles/fonts.js';

// Constant UI strings.
const strings = {
  previewToolbarLabel: () => msg('Preview', {desc: 'Preview toolbar label'}),
  refreshButton: () => msg('Refresh preview', {desc: 'Button text'}),
};

@localized()
@customElement('gpt-playground-preview')
export class GptPlaygroundPreview extends LitElement {
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
        display: flex;
        height: var(--playground-bar-height, 40px);
        justify-content: space-between;
        padding: 0 8px;
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

  render() {
    return html`
      <div class="toolbar" part="toolbar">
        <span class="toolbar-label">${strings.previewToolbarLabel()}</span>
        <configurator-icon-button
          icon="refresh"
          title="${strings.refreshButton()}"
          @click="${this.refreshPreview}"
        >
        </configurator-icon-button>
      </div>
      <playground-preview .project=${this.project}></playground-preview>
    `;
  }
}
