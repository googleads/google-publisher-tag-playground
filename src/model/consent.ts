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

import {TCData} from '@iabtechlabtcf/cmpapi';
import {signal, Signal} from '@lit-labs/signals';

export interface ConsentData {
  /**
   * GDPR Transparency & Consent Framework v2 TCData object.
   *
   * @see https://github.com/InteractiveAdvertisingBureau/GDPR-Transparency-and-Consent-Framework/blob/master/TCFv2/IAB%20Tech%20Lab%20-%20CMP%20API%20v2.md#tcdata
   */
  data?: TCData;

  /**
   * Whether or not the consent workflow is currently enabled.
   */
  enabled: boolean;
}

/**
 * Signal used to coordinate consent state updates across components.
 */
export const consentSignal: Signal.State<ConsentData> = signal({
  enabled: false,
} as ConsentData);
