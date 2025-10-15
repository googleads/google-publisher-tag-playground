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

import {css} from 'lit';

import * as samplegen from '../codegen/gpt-sample.js';
import {SampleSlotConfig} from '../model/sample-config.js';
import {getSlotStyles} from '../util/template-utils.js';

import {Template} from './template.js';

/**
 * A basic (mostly unstyled) GPT sample template.
 *
 * Ads are displayed on an empty page and laid out in a basic
 * grid pattern.
 */
export class BasicSample extends Template {
  readonly inlineStyles = css`
    .ad-slot {
      border: 1px dashed;
      display: inline-block;
      margin: 10px;
    }

    .page-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: calc(100% - 400px);
      min-height: 200vh;
      margin: auto;
    }

    .status {
      margin: 10px;
      min-width: 50%;
      text-align: center;
    }
  `;

  insertSpacer(viewportPercentage?: number) {
    if (!viewportPercentage) return '';
    return `<div class="spacer" style="height: ${viewportPercentage}vh"></div>`;
  }

  async bodyHtml(): Promise<string> {
    const slotContainers: string[] = [];

    // Output containers for OOP creative status updates first.
    this.sampleConfig.slots
      .filter((slot: SampleSlotConfig) => slot.format)
      .forEach((slot: SampleSlotConfig) => {
        const id = samplegen.getSlotContainerId(this.sampleConfig, slot);
        slotContainers.push(`<div id="${id}" class="status"></div>`);
      });

    // Output ad containers for non-OOP slots second.
    this.sampleConfig.slots
      .filter((slot: SampleSlotConfig) => !slot.format)
      .forEach((slot: SampleSlotConfig, index: number) => {
        const id = samplegen.getSlotContainerId(this.sampleConfig, slot);
        slotContainers.push(
          `${
            index > 0
              ? this.insertSpacer(this.sampleConfig.template?.adSpacing)
              : ''
          }
            <div id="${id}" class="ad-slot" style="${getSlotStyles(
              slot,
            )}"></div>`,
        );
      });

    return `
        <div class="page-content">
          ${slotContainers.join('\n')}
        </div>`;
  }
}
