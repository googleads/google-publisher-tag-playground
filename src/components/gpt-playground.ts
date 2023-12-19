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

import 'playground-elements/playground-file-editor';
import 'playground-elements/playground-preview';
import 'playground-elements/playground-project';
import 'playground-elements/playground-tab-bar';

import {css, html, LitElement} from 'lit';
import {ifDefined} from 'lit-html/directives/if-defined.js';
import {customElement, property, query} from 'lit/decorators.js';
import type {PlaygroundProject} from 'playground-elements/playground-project.js';
import type {ProjectManifest} from 'playground-elements/shared/worker-api.js';

/**
 * Custom GPT Playground component.
 */
@customElement('gpt-playground')
export class GptPlayground extends LitElement {
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
   * Renders a customized playground-elements playground UI.
   * @returns
   */
  render() {
    return html`
      <playground-project id="gpt-sample" .config="${
        ifDefined(this.config)}" project-src="${ifDefined(this.projectSrc)}">
      </playground-project>

      <div id="playground" class="${
        ifDefined(this.vertical ? 'vertical' : '')}">
          ${this.renderFilePane()}
          ${this.renderPreviewPane()}
      </div>
    `;
  }

  private renderFilePane() {
    return html`
      <div id="lhs" class="${
        ifDefined(!this.previewEnabled ? 'full' : undefined)}">
          <playground-tab-bar
            id="gpt-sample-tab-bar"
            project="gpt-sample"
            editor="gpt-sample-editor">
          </playground-tab-bar>

          <playground-file-editor
            id="gpt-sample-editor"
            project="gpt-sample"
            ?readonly="${this.readonly}"
            line-numbers>
          </playground-file-editor>
      </div>
    `;
  }

  private renderPreviewPane() {
    return !this.previewEnabled ? '' : html`
      <div id="rhs">
          <playground-preview id="gpt-sample-preview" project="gpt-sample">
          </playground-preview>
      </div>
    `;
  }
}
