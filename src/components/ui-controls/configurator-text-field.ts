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

import '@material/web/textfield/filled-text-field';

import {localized} from '@lit/localize';
import {MdFilledTextField} from '@material/web/textfield/filled-text-field.js';
import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';

@localized()
@customElement('configurator-text-field')
export class ConfiguratorTextField extends LitElement {
  @query('md-filled-text-field') private input?: MdFilledTextField;

  static styles = css`
    :host {
      display: flex;
      flex-flow: row wrap;
      width: 100%;
    }

    md-filled-text-field {
      padding: 0 0 8px;
      width: 100%;

      --md-filled-field-leading-space: 10px;
      --md-filled-field-top-space: calc(0.75rem - 2px);
      --md-filled-field-trailing-space: 10px;
      --md-filled-field-with-label-bottom-space: 4px;
      --md-filled-field-with-label-top-space: 2px;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({attribute: 'id', type: String})
  id = `text-field-${Date.now().toString()}`;

  /**
   * Custom error text to be shown when the input state is
   * invalid. Only used when `pattern` is specified.
   */
  @property({attribute: 'error-text', type: String}) errorText?: string;

  /**
   * User-friendly label for the element.
   */
  @property({attribute: 'label', type: String}) label?: string;

  /**
   * Name content attribute of the element.
   */
  @property({attribute: 'name', type: String}) name?: string;

  /**
   * Pattern content attribute of the element.
   */
  @property({attribute: 'pattern', type: String}) pattern?: string;

  /**
   * The text shown when the element has no value.
   */
  @property({attribute: 'placeholder', type: String}) placeholder?: string;

  /**
   * Returns the end offset of a text selection.
   *
   * @readonly
   */
  get selectionEnd() {
    return this.input?.selectionEnd;
  }

  /**
   * Returns the start offset of a text selection.
   *
   * @readonly
   */
  get selectionStart() {
    return this.input?.selectionStart;
  }

  private internalValue = '';

  /**
   * Current value of the element.
   */
  @property({attribute: 'value', type: String})
  get value() {
    return this.internalValue;
  }

  set value(value: string) {
    this.internalValue = value;
    if (this.input) this.input.value = this.internalValue;
  }

  /**
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus}
   */
  focus() {
    this.input?.focus();
  }

  /**
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/reportValidity}
   */
  reportValidity() {
    if (this.pattern) {
      // Disable custom validity to re-enable default constraint validation.
      this.setCustomValidity('');

      if (!this.input?.validity.valid && this.errorText) {
        // Set a custom validation message if the input is invalid.
        this.setCustomValidity(this.errorText);
      }
    }

    return this.input?.reportValidity();
  }

  /**
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/setCustomValidity}
   */
  setCustomValidity(error: string) {
    this.input?.setCustomValidity(error);
  }

  private handleInput() {
    this.internalValue = this.input!.value;

    if (this.reportValidity()) {
      // Fire an event to let the configurator know a value has changed.
      this.dispatchEvent(
        new CustomEvent('update', {bubbles: true, composed: true}),
      );
    }
  }

  private refireEvent(event: Event) {
    this.internalValue = this.input!.value;

    // Prevent the event from bubbling.
    event.stopImmediatePropagation();

    // Dispatch a copy of the event, originating from this component.
    const clonedEvent = Reflect.construct(event.constructor, [
      event.type,
      event,
    ]);
    const dispatched = this.dispatchEvent(clonedEvent);

    // Prevent default if the dispatched event wasn't cancelled.
    if (!dispatched) {
      event.preventDefault();
    }
  }

  render() {
    return html`<md-filled-text-field
      id="${this.id}"
      label="${ifDefined(this.label)}"
      name="${ifDefined(this.name)}"
      pattern="${ifDefined(this.pattern)}"
      placeholder="${ifDefined(this.placeholder)}"
      value="${this.value}"
      @change="${this.refireEvent}"
      @input="${this.handleInput}"
      @keydown="${this.refireEvent}"
      @keyup="${this.refireEvent}"
      @select="${this.refireEvent}"
    ></md-filled-text-field>`;
  }
}
