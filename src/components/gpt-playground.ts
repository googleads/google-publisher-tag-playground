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

import './gpt-playground-preview';
import './playground-dialog';
import './ui-controls/resizable-area';
import 'playground-elements/playground-file-editor';
import 'playground-elements/playground-project';
import 'playground-elements/playground-tab-bar';

import {localized, msg, str} from '@lit/localize';
import {css, html, LitElement} from 'lit';
import {ifDefined} from 'lit-html/directives/if-defined.js';
import {customElement, property, query} from 'lit/decorators.js';
import type {PlaygroundProject} from 'playground-elements/playground-project.js';
import type {ProjectManifest} from 'playground-elements/shared/worker-api.js';

import {window} from '../model/window.js';
import {PlaygroundConfig} from '../util/playground-config.js';

import type {GptPlaygroundPreview} from './gpt-playground-preview.js';
import {PlaygroundDialog, PlaygroundDialogButton} from './playground-dialog.js';
import {fontStyles} from './styles/fonts.js';
import {materialStyles} from './styles/material-theme.js';

// Constant UI strings.
const strings = {
  previewDialog: () =>
    msg(
      str`${strings.previewUnavailable()}. Click the button below to preview in a new window.`,
      {
        desc: 'Embedded preview is unavailable, sample must be viewed in a separate window.',
      },
    ),
  previewDialogButton: () => msg('Open preview', {desc: 'Button text'}),
  previewToolbarLabel: () => msg('Preview', {desc: 'Preview toolbar label'}),
  previewUnavailable: () =>
    msg('This sample cannot be previewed in an iframe', {
      desc: 'Reason the embedded preview is unavailable.',
    }),
};

// Playground component identifier.
const PLAYGROUND_ID = 'gpt-sample';

/**
 * Custom GPT Playground component.
 */
@localized()
@customElement('gpt-playground')
export class GptPlayground extends LitElement {
  @query('gpt-playground-preview') private preview?: GptPlaygroundPreview;
  @query('playground-dialog') private previewDialog?: PlaygroundDialog;

  // Declare shadow DOM styles.
  static styles = [
    fontStyles,
    materialStyles,
    css`
      :host {
        border: 1px solid var(--md-sys-color-outline);
        border-radius: 8px;
        display: flex;
        height: calc(100% - 2px);
        overflow: hidden;

        --playground-border-color: var(--md-sys-color-surface-container-high);
        --playground-tab-bar-active-color: rgb(39 148 59);
        --playground-highlight-color: rgb(39 148 59);
        --playground-tab-bar-background: var(
          --md-sys-color-surface-container-low
        );
        --playground-tab-bar-foreground-color: var(--md-sys-color-on-surface);
        --playground-preview-toolbar-background: var(
          --md-sys-color-surface-container-low
        );
        --playground-preview-toolbar-foreground-color: var(
          --md-sys-color-on-surface
        );

        --playground-code-font-size: var(--code-font-size);
        --playground-code-font-family: var(--code-font-family);
        --playground-tab-bar-font-size: 15px;
      }

      #lhs {
        border-inline-end: 2px solid
          var(--md-sys-color-surface-container-highest);
        display: flex;
        flex-direction: column;
        min-width: 200px;
        height: 100%;
        width: calc(100% - 2px);
      }

      [vertical] #lhs {
        border: unset;
        width: 100%;
      }

      #rhs {
        height: 100%;
        min-height: 200px;
        min-width: 200px;
        position: relative;
      }

      playground-tab-bar {
        border-block-end: none;
        height: auto;
        min-width: 0;
      }

      playground-file-editor {
        flex: 1 0 0;
        height: 100%;
        min-height: 0;
      }

      gpt-playground-preview::part(toolbar) {
        border-block-end: none;
      }

      [vertical] gpt-playground-preview::part(toolbar) {
        border-block-end: 1px solid var(--playground-border-color);
        border-block-start: 1px solid var(--playground-border-color);
        border-radius: 8px 8px 0 0;
      }
    `,
  ];

  /**
   * An optional configuration object to pass to the {@link PlaygroundProject}
   * encapsulated by this component at render time.
   */
  @property({attribute: 'config', type: Object}) config?: ProjectManifest;

  /**
   * Controls whether or not the preview pane is displayed.
   */
  @property({attribute: 'preview-enabled', type: Boolean})
  previewEnabled = false;

  /**
   * An optional project configuration file to pass to the {@link
   * PlaygroundProject} encapsulated by this component at render time.
   */
  @property({attribute: 'project-src', type: String}) projectSrc?: string;

  /**
   * Controls whether or not the code editor allows user edits.
   */
  @property({attribute: 'readonly', type: Boolean}) readonly = false;

  /**
   * Specifies whether the playground should use a stacked layout, instead
   * of the default side-by-side view.
   */
  @property({attribute: 'vertical', type: Boolean}) vertical = false;

  /**
   * A reference to the {@link PlaygroundProject} encapsulated by this
   * component.
   */
  @query('playground-project') project!: PlaygroundProject;

  /**
   * A reference to the external preview window, if one has been opened.
   */
  previewWindow: Window | null = null;

  /**
   * Disconnect the preview pane and display the preview dialog.
   */
  disablePreview() {
    if (this.preview) this.preview.project = undefined;
    if (this.previewDialog) this.previewDialog.open = true;
  }

  /**
   * Connect the preview pane and hide the preview dialog.
   */
  enablePreview() {
    if (this.preview) this.preview.project = this.project;
    if (this.previewDialog) this.previewDialog.open = false;
  }

  /**
   * Renders a customized playground-elements playground UI.
   * @returns
   */
  render() {
    return html`
      <playground-project
        id="${PLAYGROUND_ID}"
        .config="${this.config}"
        project-src="${ifDefined(this.projectSrc)}"
      >
      </playground-project>

      <resizable-area primary-percent="50" ?vertical="${this.vertical}">
        ${this.renderFilePane()} ${this.renderPreviewPane()}
      </resizable-area>
    `;
  }

  private renderFilePane() {
    return html`
      <div id="lhs" slot="primary">
        <playground-tab-bar
          id="${PLAYGROUND_ID}-tab-bar"
          project="${PLAYGROUND_ID}"
          editor="${PLAYGROUND_ID}-editor"
        >
        </playground-tab-bar>

        <playground-file-editor
          id="${PLAYGROUND_ID}-editor"
          project="${PLAYGROUND_ID}"
          ?readonly="${this.readonly || !this.previewEnabled}"
          line-numbers
        >
        </playground-file-editor>
      </div>
    `;
  }

  private renderPreviewPane() {
    return html`
      <div id="rhs" slot="secondary">
        ${this.renderPreviewDialog()}
        <gpt-playground-preview id="${PLAYGROUND_ID}-preview">
        </gpt-playground-preview>
      </div>
    `;
  }

  private renderPreviewDialog() {
    const buttons: PlaygroundDialogButton[] = [
      {
        text: `${strings.previewDialogButton()}`,
        onClick: () => {
          this.previewWindow = window.open(
            this.generatePreviewUrl(),
            'gpt-preview',
          );
        },
      },
    ];

    return html`
      <playground-dialog
        .text="${[strings.previewDialog()]}"
        .buttons="${buttons}"
        ?open="${!this.previewEnabled}"
        modal
      >
      </playground-dialog>
    `;
  }

  generatePreviewUrl() {
    if (PlaygroundConfig.sample) {
      // Extract sample ID.
      // Ex: 'display-test-ad-js' -> 'display-test-ad'
      const sample = PlaygroundConfig.sample.replace(/(.*?)-[jt]s/, '$1');
      return `https://googleads.github.io/google-publisher-tag-samples/${
        sample
      }/js/demo.html`;
    }

    const previewPath = `preview#config=${
      PlaygroundConfig.sampleConfigHash
    }&hl=${PlaygroundConfig.locale}`;
    return `${PlaygroundConfig.baseUrl}/${previewPath}`;
  }

  firstUpdated() {
    // Connect the preview pane on first update, when the parent project is
    // guaranteed available.
    if (this.previewEnabled) this.preview!.project = this.project;
  }
}
