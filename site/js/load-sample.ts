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

import '../../src/components/gpt-playground';

import {html, render} from 'lit-html';

import {setLocale} from '../../src/util/localization-utils.js';
import {PlaygroundConfig} from '../../src/util/playground-config.js';

setLocale(PlaygroundConfig.locale);

// The sample to fall back to if nothing is specified.
const DEFAULT_SAMPLE = 'config/display-test-ad-js.json';

// Attempt to retrive sample details from config
const sampleToDisplay = PlaygroundConfig.sample
  ? `config/${PlaygroundConfig.sample}.json`
  : DEFAULT_SAMPLE;

// Load the specified (or default) sample.
render(
  html`
    <gpt-playground
      project-src="${PlaygroundConfig.baseUrl}/${sampleToDisplay}"
      ?preview-enabled="${PlaygroundConfig.preview}"
    >
    </gpt-playground>
  `,
  document.body,
);
