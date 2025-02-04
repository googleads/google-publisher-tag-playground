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

import './config-section';
import './configurator-text-field';
import '@material/web/chips/chip-set';
import '@material/web/chips/input-chip';

import {MdInputChip} from '@material/web/chips/input-chip.js';
import {css, html, LitElement} from 'lit';
import {property, query, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {isEqual} from 'lodash-es';

import {ConfiguratorTextField} from './configurator-text-field.js';

/**
 * Custom input control that supports adding/editing multiple values
 * (represented as chips), with customizable formatting and validation.
 */
export abstract class ChipInput extends LitElement {
  @query('configurator-text-field', true) chipInput!: ConfiguratorTextField;

  static styles = [
    css`
      :host {
        width: 100%;
      }

      md-chip-set {
        padding: 5px 0;
        width: 100%;
      }

      md-input-chip {
        background-color: var(--md-sys-color-secondary-fixed);
        max-width: 100%;

        --md-input-chip-label-text-color: var(
          --md-sys-color-on-secondary-fixed
        );
      }
    `,
  ];

  /**
   * The title to be displayed in the `config-section` for this element.
   *
   * @memberof ChipInput
   */
  @property({attribute: 'title', type: String}) title = '';

  /**
   * The values to be displayed.
   *
   * @protected
   * @abstract
   * @type {string[]}
   * @memberof ChipInput
   */
  @state() protected abstract chips: string[];

  /**
   * A set of strings which can be used to delimit multiple values.
   *
   * @protected
   * @abstract
   * @type {string[]}
   * @memberof ChipInput
   */
  protected abstract delimiters: string[];

  /**
   * The title to be displayed for this input.
   *
   * @protected
   * @abstract
   * @memberof ChipInput
   */
  protected abstract chipInputLabel: () => string;

  /**
   * The placeholder text to display when the input is focused, but empty.
   *
   * @protected
   * @abstract
   * @memberof ChipInput
   */
  protected abstract chipInputPlaceholder: () => string;

  /**
   * Custom validation logic to be run when a value is added.
   *
   * @param chip A newly added value.
   * @returns
   *  A `null` or empty return value indicates that the value is valid.
   *  A non-empty return value is interpretted as a validation error message,
   *  which is displayed to the user.
   */
  protected abstract validateChip(chip: string): string | null;

  /**
   * Controls the sort order of displayed values.
   *
   * By default, a natural sort order is used. Extending classes may
   * override this method to implement a custom sort order.
   *
   * @param chips A set of values to be sorted.
   * @returns The set of input values, sorted.
   */
  protected sortChips(chips: string[]): string[] {
    return chips.sort();
  }

  /**
   * Dispatches a custom `update` event that other elements can listen for.
   */
  private announceUpdate() {
    // Fire an event to let the configurator know a value has changed.
    this.dispatchEvent(
      new CustomEvent('update', {bubbles: true, composed: true}),
    );
  }

  /**
   * Splits input text into values, using the configured delimiters.
   */
  private parseChipInput(): string[] {
    const delimitedChipString = this.chipInput.value;
    return delimitedChipString.split(
      new RegExp(`[${this.delimiters.join('')}]+`),
    );
  }

  /**
   * Validates input text and displays validation errors as appropriate.
   */
  private validateChipInput(): boolean {
    const chips = this.parseChipInput();

    for (const chip of chips) {
      const validationError = this.validateChip(chip) ?? '';
      if (validationError) {
        this.updateChipInputValidity(validationError);
        return false;
      }
    }

    this.updateChipInputValidity('');
    return true;
  }

  /**
   * Sets the validation state of the input element.
   *
   * An empty error string will reset validity.
   */
  private updateChipInputValidity(error: string) {
    this.chipInput.setCustomValidity(error);
    this.chipInput.reportValidity();
  }

  /**
   * Validates and adds new values to the chip display.
   */
  private maybeAddChipsFromInput() {
    if (!this.validateChipInput()) return;

    let chips = Array.from(this.chips);
    this.parseChipInput().forEach(chip => {
      if (!chips.includes(chip)) chips.push(chip);
    });
    chips = this.sortChips(chips);

    // If the set of values changed, dispatch an update event.
    if (!isEqual(this.chips, chips)) {
      this.chips = chips;
      this.announceUpdate();
    }

    // Clear the input.
    this.chipInput.value = '';
  }

  /**
   * Handle keydown events.
   */
  private handleChipInputKeydown(event: KeyboardEvent) {
    const {key} = event;
    if (['Backspace', 'Delete'].includes(key)) {
      // If this action will clear the input, reset validity.
      if (
        this.chipInput.value.length === 1 ||
        (this.chipInput.selectionEnd &&
          this.chipInput.selectionEnd - this.chipInput.selectionStart! ===
            this.chipInput.value.length)
      ) {
        this.updateChipInputValidity('');
      }
    } else if (['Enter', ...this.delimiters].includes(key)) {
      event.preventDefault();
      this.maybeAddChipsFromInput();
    }
  }

  /**
   * Handle value edit request.
   */
  private handleChipClick(event: Event) {
    const target = event.target as MdInputChip;
    const chip = target.textContent!;

    // Return the value to the input, appending to any existing value.
    this.chipInput.value = this.chipInput.value
      ? [this.chipInput.value, chip].join(this.delimiters[0])
      : chip;
    this.chipInput.focus();

    // Remove the value from the display set while editing.
    this.handleChipRemove(event);
  }

  /**
   * Handle value delete request.
   */
  private handleChipRemove(event: Event) {
    const target = event.target as MdInputChip;
    const chip = target.textContent!;

    // Remove the value from the display set and dispatch an update event.
    //
    // Note that we explicitly set this.chips here, since the accessor
    // is what triggers Lit to re-render the component. Editing the array
    // in place (eg, split) will not properly update the UI.
    this.chips = this.chips.filter(c => c !== chip);
    this.announceUpdate();
  }

  render() {
    // We use repeat below to avoid re-rendering the entire chip set
    // when values are added/removed. If the order of existing values
    // changes, those elements are rearranged in the DOM rather than
    // being deleted/recreated.
    return html`
      <config-section nested title="${this.title}">
        <md-chip-set>
          ${repeat(
            this.chips,
            chip => chip,
            chip => {
              return html`<md-input-chip
                title="${chip}"
                @click="${this.handleChipClick}"
                @remove="${this.handleChipRemove}"
                >${chip}</md-input-chip
              >`;
            },
          )}
        </md-chip-set>
        <configurator-text-field
          label="${this.chipInputLabel()}"
          placeholder="${this.chipInputPlaceholder()}"
          @keydown="${this.handleChipInputKeydown}"
        >
        </configurator-text-field>
      </config-section>
    `;
  }
}
