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

import './playground-dialog';
import 'playground-elements/playground-file-editor';
import 'playground-elements/playground-preview';
import 'playground-elements/playground-project';
import 'playground-elements/playground-tab-bar';

import {css, html, LitElement} from 'lit';
import {ifDefined} from 'lit-html/directives/if-defined.js';
import {customElement, property, query} from 'lit/decorators.js';
import {when} from 'lit/directives/when.js';
import {PlaygroundPreview} from 'playground-elements/playground-preview.js';
import type {PlaygroundProject} from 'playground-elements/playground-project.js';
import type {ProjectManifest} from 'playground-elements/shared/worker-api.js';

import {PlaygroundDialog, PlaygroundDialogButton} from './playground-dialog.js';

// Constant UI strings.
const PREVIEW_DIALOG =
  'This sample cannot be previewed in an iframe. ' +
  'Click the button below to preview in a new window.';
const PREVIEW_DIALOG_BUTTON = 'Open preview';

// Playground component identifier.
const PLAYGROUND_ID = 'gpt-sample';

/**
 * Custom GPT Playground component.
 */
@customElement('gpt-playground')
export class GptPlayground extends LitElement {
  @query('playground-preview') private preview!: PlaygroundPreview;
  @query('playground-dialog') private previewDialog!: PlaygroundDialog;

  // Declare shadow DOM styles.
  static styles = css`
    :host {
      flex: 1;
    }

    #playground {
      display: flex;
      flex: 1;
      height: 100%;
    }

    #playground.vertical {
      flex-direction: column;
    }

    #lhs {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 200px;
      height: var(--tabs-and-editor-height, 100%);
      width: var(--tabs-and-editor-width, 50%);
    }

    #lhs.full,
    #playground.vertical #lhs {
      --tabs-and-editor-width: 100%;
    }

    #rhs {
      flex: 1;
      margin-left: -3px;
      min-height: 200px;
      min-width: 200px;
      position: relative;
    }

    #playground.vertical #rhs {
      margin-left: 0;
    }

    playground-tab-bar {
      border-bottom: none;
      height: auto;
      min-width: 0;
    }

    playground-file-editor {
      flex: 1 0 0;
    }

    playground-preview {
      height: 100%;
    }
  `;

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
   * Disconnect the preview pane and display the preview diaalog.
   */
  disablePreview() {
    this.preview.project = '';
    this.previewDialog.open = true;
  }

  /**
   * Connect the preview pane and hide the preview dialog.
   */
  enablePreview() {
    this.preview.project = PLAYGROUND_ID;
    this.previewDialog.open = false;
  }

  /**
   * Renders a customized playground-elements playground UI.
   * @returns
   */
  render() {
    return html`
      <playground-project
        id="${PLAYGROUND_ID}"
        .config="${ifDefined(this.config)}"
        project-src="${ifDefined(this.projectSrc)}"
      >
      </playground-project>

      <div
        id="playground"
        class="${ifDefined(this.vertical ? 'vertical' : '')}"
      >
        ${this.renderFilePane()} ${this.renderPreviewPane()}
      </div>
    `;
  }

  private renderFilePane() {
    return html`
      <div id="lhs">
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
      <div id="rhs">
        ${this.renderPreviewDialog()}
        <playground-preview
          id="${PLAYGROUND_ID}-preview"
          project="${when(this.previewEnabled, () => PLAYGROUND_ID)}"
        >
        </playground-preview>
      </div>
    `;
  }

  private renderPreviewDialog() {
    const buttons: PlaygroundDialogButton[] = [
      {
        text: `${PREVIEW_DIALOG_BUTTON}`,
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
        .text="${[PREVIEW_DIALOG]}"
        .buttons="${buttons}"
        ?open="${!this.previewEnabled}"
        modal
      >
      </playground-dialog>
    `;
  }

  private generatePreviewUrl() {
    if (this.projectSrc) {
      // Extract sample ID from the project src
      // Ex: 'config/display-test-ad-js.json' -> 'display-test-ad'
      const sample = this.projectSrc.replace(/.*?\/(.*?)-[jt]s.json/, '$1');
      return `https://googleads.github.io/google-publisher-tag-samples/${
        sample
      }/js/demo.html`;
    }

    return window.location.href.replace('/configurator', '/preview');
  }
}
