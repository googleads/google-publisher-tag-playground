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

import {Signal, SignalWatcher} from '@lit-labs/signals';
import {localized} from '@lit/localize';
import {MdSwitch} from '@material/web/switch/switch.js';
import {css, html, LitElement} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';
import {ifDefined} from 'lit/directives/if-defined.js';

/**
 * A collection of inheritance signals, indexed by {@link
 * InheritableCheckbox.inheritanceKey}.
 */
const SIGNAL_STORE: Record<string, Signal.State<boolean>> = {};

@localized()
@customElement('inheritable-checkbox')
export class InheritableCheckbox extends SignalWatcher(LitElement) {
  @query('md-switch') input!: MdSwitch;

  static styles = css`
    :host {
      display: flex;
      min-width: 200px;
      padding: 8px 0;
      width: 50%;

      --md-switch-track-height: 24px;
      --md-switch-track-width: 36px;
      --md-switch-selected-handle-height: 18px;
      --md-switch-selected-handle-width: 18px;
    }

    label {
      align-items: center;
      display: flex;
    }

    md-switch {
      padding: 0 8px;
    }
  `;

  /**
   * ID content attribute of the element.
   *
   * Will be automatically generated if not specified.
   */
  @property({type: String}) id = `checkbox-${Date.now().toString()}`;

  /**
   * User-friendly label for the element.
   */
  @property({type: String}) label?: string;

  /**
   * Name content attribute of the element.
   */
  @property({type: String}) name?: string;

  /**
   * A key used to link a parent and child control.
   */
  @property({type: String}) inheritanceKey!: string;

  /**
   * Whether this control should inherit from the parent control specified
   * by {@link inheritanceKey}. If `false`, this control is considered the
   * parent.
   */
  @property({type: Boolean}) inherits = false;

  /**
   * The string value of the control. Must be one of `'true'`, '`false'`, or
   * `undefined`.
   */
  @property({type: String}) value: string | undefined;

  /**
   * The boolean value of the control. Read-only.
   */
  @property({type: Boolean})
  get checked() {
    return this.value === undefined ? undefined : JSON.parse(this.value);
  }

  private getCheckedWithInheritance() {
    // Determine checked state based on the signal state.
    //
    // Note that returning a value not based on the signal state here
    // will cause the control to stop responding to signal updates.
    const signal = this.getInheritanceSignal();
    return (this.checked ?? signal.get()) === signal.get()
      ? signal.get()
      : !signal.get();
  }

  private getInheritanceSignal() {
    let signal = SIGNAL_STORE[this.inheritanceKey];
    if (!signal) {
      signal = new Signal.State<boolean>(false);
      SIGNAL_STORE[this.inheritanceKey] = signal;
    }
    return signal;
  }

  private handleClick() {
    // Toggle the state of the control and update the signal if necessary.
    const selected = !this.getCheckedWithInheritance();
    if (!this.inherits) this.getInheritanceSignal().set(selected);

    // Set the value as follows:
    // 1. If this is a parent, set the new value.
    // 2. If this is a child and the new value and signal differ, set the new
    //    value.
    // 3. If this is a child and the new value matches the signal, set
    //    `undefined` to inherit.
    this.value =
      this.inherits && selected === this.getInheritanceSignal().get()
        ? undefined
        : selected.toString();

    this.triggerUpdate();
  }

  private triggerUpdate() {
    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  render() {
    return html`<label for="${this.id}">
      <md-switch
        id="${this.id}"
        name="${ifDefined(this.name)}"
        ?selected="${this.getCheckedWithInheritance()}"
        @change="${this.handleClick}"
      >
      </md-switch>
      ${this.label}
    </label>`;
  }

  firstUpdated() {
    // Initialize the inheritance signal as soon as the parent control becomes
    // available.
    if (!this.inherits) this.getInheritanceSignal().set(this.checked);
  }

  willUpdate() {
    if (this.inherits && this.checked === this.getInheritanceSignal().get()) {
      // The parent control has been updated to match the state of this child.
      // Set the state of this child to inheriting and manually trigger a UI
      // update (this is necessary since the state change is not user
      // initiated).
      this.value = undefined;
      this.triggerUpdate();
    }
  }
}
