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
import {ProjectManifest} from 'playground-elements/shared/worker-api.js';

import * as samplegen from '../codegen/gpt-sample.js';
import {SampleConfig} from '../model/sample-config.js';
import {ScriptTarget} from '../model/typescript.js';
import {formatHtml} from '../util/format-code.js';
import {tsToJs} from '../util/transpile-code.js';

const GPT_STANDARD_URL = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
const GPT_LIMITED_ADS_URL =
  'https://pagead2.googlesyndication.com/tag/js/gpt.js';

/**
 * Base class from which all sample templates extend.
 */
export abstract class Template {
  /** Inline styles to be applied to the main HTML document. */
  readonly inlineStyles = css``;
  /** JS modules to include in the main HTML document. */
  readonly modules: string[] = [];
  /** JS scripts to include in the main HTML document (including GPT!). */
  readonly scripts: string[] = [this.gptUrl()];
  /** Stylesheets to include in the main HTML document. */
  readonly stylesheets: string[] = [];

  /* Public methods. */

  /**
   * @param sampleConfig The {@link SampleConfig} this template represents.
   * @param jsTarget The JavaScript version to target.
   */
  constructor(
    public sampleConfig: SampleConfig,
    public jsTarget?: ScriptTarget,
  ) {}

  /**
   * Returns the `<body>` HTML of the current sample, excluding code to
   * request and render ads (if applicable).
   *
   * HTML content is not guaranteed to be formatted.
   */
  abstract bodyHtml(): Promise<string>;

  /**
   * Returns the `<head>` HTML of the curent sample.
   *
   * HTML content is not guaranteed to be formatted.
   */
  async headHtml(): Promise<string> {
    const gptInit = await this.gptInitialization();
    const inlineStyles = this.inlineStyles.cssText
      ? `<style>${this.inlineStyles.cssText}</style>`
      : '';
    const modules = this.modules
      .map(s => `<script type="module" src="${s}"></script>`)
      .join('');
    const scripts = this.scripts
      .map(s => `<script async src="${s}"></script>`)
      .join('');
    const stylesheets = this.stylesheets
      .map(s => `<link href="${s}" rel="stylesheet" />`)
      .join('');

    return `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${stylesheets}${scripts}${modules}${gptInit}${inlineStyles}
    `.trim();
  }

  /**
   * Returns the complete, formatted HTML content of the current sample,
   * including GPT initialization and code to request and render ads.
   */
  async formattedHtml(): Promise<string> {
    const html = `
    <!doctype html>
    <html>
      <head>
        ${await this.headHtml()}
      </head>
      <body>
        ${await this.bodyHtml()}
        ${await this.gptRequestAndRenderAds()}
      </body>
    </html>
    `.trim();

    return await formatHtml(html);
  }

  /**
   * Returns the HTML code necessary to initialize GPT for the current sample.
   */
  async gptInitialization(): Promise<string> {
    if (this.jsTarget) {
      const gptInit = tsToJs(
        await samplegen.initializeGpt(this.sampleConfig, false),
        this.jsTarget,
      );
      return `<script>${gptInit}</script>`.trim();
    }

    return '<script type="module" src="./sample.js"></script>';
  }

  /**
   * Returns the HTML code necessary to request and render ads for the current
   * sample.
   */
  async gptRequestAndRenderAds(): Promise<string> {
    if (this.jsTarget) {
      const requestAndRenderAds = tsToJs(
        await samplegen.requestAndRenderAds(this.sampleConfig),
        this.jsTarget,
      );
      return `<script>${requestAndRenderAds}</script>`.trim();
    }

    return '';
  }

  /**
   * Returns a playground {@link ProjectManifest} for the current template.
   */
  async playgroundConfig(): Promise<ProjectManifest> {
    const config: ProjectManifest = {files: {}};

    if (!this.jsTarget) {
      // TypeScript samples have seperate HTML and TS files.
      config.files!['sample.ts'] = {
        content: await samplegen.initializeGpt(this.sampleConfig),
      };
      // Include a hidden package.json, to enable autocomplete of GPT methods.
      config.files!['package.json'] = {
        content: '{"dependencies": {"@types/google-publisher-tag": "^1.0.0"}}',
        hidden: true,
      };
    }

    config.files!['index.html'] = {content: await this.formattedHtml()};

    return config;
  }

  /* Protected methods. */

  /**
   * Retrieve the appropriate GPT URL for the current sample.
   */
  protected gptUrl(): string {
    return this.sampleConfig.page?.privacy?.ltd
      ? GPT_LIMITED_ADS_URL
      : GPT_STANDARD_URL;
  }
}
