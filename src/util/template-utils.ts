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

import {SampleSlotConfig} from '../model/sample-config.js';

/**
 * Generates an inline style string for the specified slot.
 *
 * CSS styles included in the output:
 * - min-height = The smallest specified height value
 * - min-width = The smallest specified width value (or 50% for fluid slots)
 *
 * @param slot
 * @returns
 */
export function getSlotStyles(slot: SampleSlotConfig): string {
  const maxValue = Number.MAX_VALUE;

  let minH = maxValue;
  let minW = maxValue;

  if (Array.isArray(slot.size)) {
    // Convert googletag.SingleSize to googletag.MultiSize for simplicity.
    const sizes =
      slot.size.length === 2 && typeof slot.size[0] === 'number'
        ? [slot.size]
        : slot.size;

    for (const size of sizes) {
      if (Array.isArray(size) && typeof size[0] === 'number') {
        if (minH >= size[1]) minH = size[1];
        if (minW >= size[0]) minW = size[0];
      }
    }
  }

  return minH < maxValue && minW < maxValue
    ? `min-height: ${minH}px; min-width: ${minW}px;`
    : 'min-width: 50%';
}
