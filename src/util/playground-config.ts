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

import {isUndefined} from 'lodash-es';

import {window} from '../model/window.js';

import {getParameter, setParameter} from './url-hash.js';

// Ensure the playground config object is defined.
window.playgroundConfig = window.playgroundConfig || {};

export class PlaygroundConfig {
  /**
   * Returns the GPT Playground base URL.
   */
  static get baseUrl(): string {
    const baseUrl =
      window.playgroundConfig.baseUrl ??
      window.location.origin +
        window.location.pathname
          .replace('/configurator', '')
          .replace('/preview', '');

    return baseUrl.replace(/^(.*?)\/?$/, '$1');
  }

  /**
   * The currently configured locale.
   *
   * Defaults to `en`. This method will always return a value.
   */
  static get locale(): string {
    return window.playgroundConfig.locale ?? getParameter('hl') ?? 'en';
  }

  static set locale(locale: string) {
    window.playgroundConfig.locale = locale;
    if (window.history) setParameter('hl', locale, window.history);
  }

  /**
   * Whether or not the preview pane is enabled.
   *
   * This setting only applies on the `load-sample` endpoint.
   */
  static get preview(): boolean {
    const preview = !isUndefined(window.playgroundConfig.preview)
      ? window.playgroundConfig.preview.toString()
      : getParameter('preview');

    return preview ? !['0', 'false'].includes(preview) : true;
  }

  static set preview(enabled: boolean) {
    window.playgroundConfig.preview = enabled;
    if (window.history) {
      setParameter('preview', enabled.toString(), window.history);
    }
  }

  /**
   * The currently configured curated sample.
   *
   * This setting only applies on the `load-sample` endpoint.
   */
  static get sample(): string | null {
    return window.playgroundConfig.sample ?? getParameter('sample');
  }

  static set sample(sample: string) {
    window.playgroundConfig.sample = sample;
    if (window.history) setParameter('sample', sample, window.history);
  }

  /**
   * The currently configured Sample Builder sample.
   *
   * This setting only applies on the `generate-sample` endpont.
   */
  static get sampleConfigHash(): string | null {
    return window.playgroundConfig.config ?? getParameter('config');
  }

  static set sampleConfigHash(sampleConfig: string) {
    window.playgroundConfig.config = sampleConfig;
    if (window.history) setParameter('config', sampleConfig, window.history);
  }
}
