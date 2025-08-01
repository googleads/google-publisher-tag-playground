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

import {html, render} from 'lit-html';
import {unsafeHTML} from 'lit/directives/unsafe-html.js';

import {SampleConfig} from '../../src/model/sample-config.js';
import {ScriptTarget} from '../../src/model/typescript.js';
import {createTemplate} from '../../src/template/template-factory.js';
import * as base64url from '../../src/util/base64url.js';
import {migrateLegacyProperties} from '../../src/util/compatibility-utils.js';
import {setLocale} from '../../src/util/localization-utils.js';
import {PlaygroundConfig} from '../../src/util/playground-config.js';

setLocale(PlaygroundConfig.locale);

const config: SampleConfig = PlaygroundConfig.sampleConfigHash
  ? JSON.parse(base64url.decode(PlaygroundConfig.sampleConfigHash))
  : null;

if (config) {
  const template = createTemplate(migrateLegacyProperties(config));
  // Force the target output to ES2020, so it can be rendered directly.
  template.jsTarget = ScriptTarget.ES2020;

  // Inject link tags.
  template.stylesheets.forEach(s => {
    addStylesheet(s);
  });

  // Inject scripts tags.
  template.scripts.forEach(s => {
    addScript(s);
  });

  template.modules.forEach(s => {
    addScript(s, true);
  });

  // Render inline styles.
  render(
    html`<style>
      ${template.inlineStyles}
    </style>`,
    document.head,
  );

  // Execute GPT initialization logic.
  addInlineScript(await template.gptInitialization());

  // Render body content.
  render(html`${unsafeHTML(await template.bodyHtml())}`, document.body);

  // Execute GPT request/render logic.
  addInlineScript(await template.gptRequestAndRenderAds());
}

function addInlineScript(content: string) {
  // Remove script tags (if present), strip comments and linebreaks.
  const inlineScript = content
    .replace('<script>', '')
    .replace('</script>', '')
    .replace(/\s+?\/\/.*?\n/g, '')
    .replace(/\n/g, '');

  const tag = document.createElement('script');
  tag.innerText = inlineScript;
  document.body.appendChild(tag);
}

function addScript(script: string, module = false) {
  const tag = document.createElement('script');
  tag.src = script;
  tag.async = true;
  if (module) {
    tag.type = 'module';
  }
  document.head.appendChild(tag);
}

function addStylesheet(stylesheet: string) {
  const tag = document.createElement('link');
  tag.href = stylesheet;
  tag.rel = 'stylesheet';
  document.head.appendChild(tag);
}
