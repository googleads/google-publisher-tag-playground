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

import {css, html, LitElement} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';

/**
 * A control that allows for freely resizing 2 neightboring containers along a
 * horizontal or vertical axis.
 */
@customElement('resizable-area')
export class ResizableArea extends LitElement {
  static styles = css`
    :host {
      display: block;

      --drag-bar-active-background: var(--md-sys-color-inverse-surface);
      --drag-bar-active-color: var(--md-sys-color-inverse-on-surface);

      --drag-bar-hover-background: var(--md-sys-color-surface-container-high);
      --drag-bar-hover-color: var(--md-sys-color-on-surface);

      --drag-bar-height: 100%;
      --drag-bar-width: 6px;
    }

    #wrapper {
      display: flex;
      flex-direction: row;
      position: relative;

      --primary-percentage: 50%;
      --_primary-size: var(--primary-percentage);
      --_secondary-size: calc(100% - var(--_primary-size));
    }

    :host([vertical]) #wrapper {
      flex-direction: column;
    }

    :host,
    #wrapper {
      height: 100%;
      width: 100%;
    }

    slot {
      display: block;
      overflow: hidden;
    }

    [name='primary'] {
      height: 100%;
      width: var(--_primary-size);
    }

    :host([vertical]) [name='primary'] {
      height: var(--_primary-size);
      width: 100%;
    }

    [name='secondary'] {
      height: 100%;
      width: var(--_secondary-size);
    }

    :host([vertical]) [name='secondary'] {
      height: var(--_secondary-size);
      width: 100%;
    }

    #drag-bar {
      align-items: center;
      align-self: center;
      display: flex;
      height: inherit;
      left: calc(var(--_primary-size) - calc(var(--drag-bar-width) / 2));
      justify-content: center;
      position: absolute;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      width: var(--drag-bar-width);
      z-index: 1000;
    }

    :host([vertical]) #drag-bar {
      left: 0;
      top: calc(var(--_primary-size) - calc(var(--drag-bar-width) / 2));
      height: var(--drag-bar-width);
      width: inherit;
    }

    #drag-bar:hover,
    #drag-bar:hover::after {
      background-color: var(--drag-bar-hover-background);
      color: var(--drag-bar-hover-color);
      cursor: grab;
    }

    #drag-bar::after {
      border-radius: 3px;
      color: transparent;
      content: 'drag_indicator';
      display: inline-block;
      font-family: 'Material Icons';
      padding: 10px 0;
    }

    :host([vertical]) #drag-bar::after {
      transform: rotate(90deg);
    }

    #drag-bar.isDragging,
    #drag-bar.isDragging::after {
      background-color: var(--drag-bar-active-background);
      color: var(--drag-bar-active-color);
      cursor: grabbing;
    }
  `;

  /**
   * Whether or not we are in the "dragging" state.
   */
  @state() private isDragging = false;

  /**
   * The percentage of the wrapper's area used by the primary panel.
   */
  @property({attribute: 'primary-percent', type: Number}) primaryPercent = 0;

  /**
   * Whether this area resizes vertically (default is horizontal).
   */
  @property({attribute: 'vertical', type: Boolean}) vertical = false;

  @query('#wrapper') private resizableWrapper!: HTMLElement;

  /**
   * A set of pointer IDs. This is necessary to properly support dragging via
   * multiple pointers (eg, multi-touch displays).
   */
  private pointerIds = new Set<number>();

  render() {
    return html`<div
      id="wrapper"
      style=${styleMap({
        '--primary-percentage': `${this.primaryPercent}%`,
      })}
    >
      <slot name="primary"></slot>
      <div
        id="drag-bar"
        tabindex="0"
        @focus=${this.onFocus}
        @blur=${this.onBlur}
        @pointerdown=${this.onPointerdown}
        @pointerup=${this.onPointerup}
        @pointermove=${this.onPointermove}
        class=${classMap({
          isDragging: this.isDragging,
        })}
      ></div>
      <slot name="secondary"></slot>
    </div>`;
  }

  private onFocus() {
    this.isDragging = true;
  }

  private onBlur() {
    this.isDragging = false;
  }

  private onPointerdown(event: PointerEvent) {
    this.isDragging = true;

    if (this.pointerIds.has(event.pointerId)) return;

    this.pointerIds.add(event.pointerId);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  private onPointerup(event: PointerEvent) {
    this.pointerIds.delete(event.pointerId);
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);

    if (this.pointerIds.size === 0) {
      this.isDragging = false;
    }
  }

  private onPointermove(event: PointerEvent) {
    if (!this.isDragging) return;

    // Stop the default (select) action from occuring.
    event.preventDefault();

    const {clientX: mouseX, clientY: mouseY} = event;
    const bounds = this.resizableWrapper.getBoundingClientRect();

    // The size of the bounding box on it's resizable axis.
    const size = this.vertical
      ? bounds.bottom - bounds.top
      : bounds.right - bounds.left;

    // Calculate how far along the resizable axis the pointer is, as a
    // percentage of the bounding box.
    const primarySize =
      ((this.vertical ? mouseY - bounds.top : mouseX - bounds.left) / size) *
      100;

    // Clamp the percentage between 0 and 100.
    this.primaryPercent = Math.min(Math.max(primarySize, 0), 100);
  }
}
