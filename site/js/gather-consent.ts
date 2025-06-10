/**
 * Copyright 2025 Google LLC
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

import {TCData} from '@iabtechlabtcf/cmpapi';
import {msg} from '@lit/localize';

import {setLocale} from '../../src/util/localization-utils.js';
import {PlaygroundConfig} from '../../src/util/playground-config.js';

// Initialize googlefc command queue.
window.googlefc = window.googlefc || {callbackQueue: []};

setLocale(PlaygroundConfig.locale);

if (window.opener) {
  document.getElementById('status')!.innerText = msg(
    'Loading consent dialog...',
    {desc: 'Message displayed when EU consent dialog is loading.'},
  );

  googlefc.callbackQueue.push({
    CONSENT_DATA_READY: () => googlefc.showRevocationMessage(),
  });

  googlefc.callbackQueue.push({
    CONSENT_API_READY: () =>
      window.__tcfapi('addEventListener', 2.2, data => {
        if (data.eventStatus === 'useractioncomplete') {
          window.opener.postMessage(data, window.location.origin);
          window.close();
        }
      }),
  });
} else {
  // If the consent endpoint was accessed directly, or the opener window
  // is otherwise unavailable, display an error.
  document.getElementById('status')!.innerText = msg(
    'Error: unable to connect to the GPT Sample Builder',
    {desc: 'Error message.'},
  );
}

declare global {
  interface Window {
    __tcfapi: (
      command: string,
      version: number,
      callback: (data: TCData) => void,
    ) => void;
  }
}
