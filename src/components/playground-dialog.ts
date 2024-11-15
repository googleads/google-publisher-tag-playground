/**
 * Copyright 2024 Google LLC
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

import {localized} from '@lit/localize';
import {css, html, LitElement} from 'lit';
import {ifDefined} from 'lit-html/directives/if-defined.js';
import {customElement, property} from 'lit/decorators.js';
import {when} from 'lit/directives/when.js';

/**
 * A button to display in a {@link PlaygroundDialog}.
 */
export interface PlaygroundDialogButton {
  text: string;
  onClick?: (event: Event) => void;
}

/**
 * Custom dialog component.
 *
 * Supports both modal and modeless modes, and can be used to display
 * arbitrary content.
 */
@localized()
@customElement('playground-dialog')
export class PlaygroundDialog extends LitElement {
  static styles = css`
    :host {
      display: grid;
      place-items: center;
      position: absolute;
      height: 100%;
      width: 100%;
    }

    [part='backdrop'] {
      background-color: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(3px);
      display: none;
      max-width: 50%;
      z-index: 9999;
    }

    [part='backdrop'].modal {
      position: absolute;
      height: 100%;
      left: 0;
      right: 0;
      max-width: 100%;
    }

    :host([open]) [part='backdrop'] {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    [part='dialog'] {
      display: flex;
      flex: 1 0 100%;
      flex-wrap: wrap;
      justify-content: center;

      background-color: white;
      border: 3px solid black;
      border-radius: 10px;
      padding: 10px;
      width: 100%;
    }

    .modal [part='dialog'] {
      max-width: 50%;
    }

    .dialog-text,
    .dialog-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      text-align: center;
      width: 100%;
    }

    .dialog-buttons {
      padding: 1em 0 0.5em 0;
    }

    span {
      padding-top: 0.5em;
    }
  `;

  /**
   * Specifies whether this dialog should allow interaction with the rest
   * of the page when shown.
   */
  @property({attribute: 'modal', type: Boolean}) modal = false;

  /**
   * Specifies whether the dialog is opened or closed.
   */
  @property({attribute: 'open', type: Boolean, reflect: true}) open = false;

  /**
   * The text content to display in this dialog.
   */
  @property({attribute: 'text', type: Array}) text: string[] = [];

  /**
   * An array of {@link PlaygroundDialogButton} objects, representing the
   * buttons to display inside the dialog.
   */
  @property({attribute: 'buttons', type: Array})
  buttons: PlaygroundDialogButton[] = [];

  private renderText() {
    return html` <div class="dialog-text">
      ${this.text.map(text => html`<span>${text}</span>`)}
    </div>`;
  }

  private renderButtons() {
    return html`
      <div class="dialog-buttons">
        ${this.buttons.map(
          button =>
            html` <button @click="${button.onClick}">${button.text}</button>`,
        )}
      </div>
    `;
  }

  render() {
    return html` <div
      part="backdrop"
      class="${ifDefined(this.modal ? 'modal' : '')}"
    >
      <div part="dialog">
        ${when(this.text.length, () => this.renderText())}
        <slot></slot>
        ${when(this.buttons.length, () => this.renderButtons())}
      </div>
    </div>`;
  }
}
