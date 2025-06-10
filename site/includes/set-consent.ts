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

import {CmpApi, TCData} from '@iabtechlabtcf/cmpapi';

const providedTCData = window.consentData || {};

if ('tcString' in providedTCData) {
  const cmpApi = new CmpApi(
    providedTCData.cmpId,
    providedTCData.cmpVersion,
    false,
    {
      getTCData: (next, tcData, status) => {
        if (typeof tcData !== 'boolean' && 'addtlConsent' in providedTCData) {
          tcData.addtlConsent = providedTCData.addtlConsent;
        }
        next(tcData, status);
      },
    },
  );
  cmpApi.update('', true);
  cmpApi.update(providedTCData.tcString, false);
}

declare global {
  interface Window {
    consentData: TCData;
  }
}
