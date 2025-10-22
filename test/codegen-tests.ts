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

import 'jasmine';

import fs from 'fs';
import path from 'path';
import {create} from 'ts-node';
import {fileURLToPath} from 'url';

import * as config from '../src/codegen/api/config.js';
import * as codegen from '../src/codegen/gpt-sample.js';
import {SampleConfig} from '../src/model/sample-config.js';
import {window} from '../src/model/window.js';

describe('Codegen', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const CONFIG_DIR = path.resolve(__dirname, './codegen-test-data/configs');

  const COMPILER = create();

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalThis = global as any;
    delete globalThis.window;
    delete globalThis.fetch;

    window.playgroundConfig = {};
  });

  beforeEach(() => {
    // Load utility file includes from the local filesystem.
    window.playgroundConfig = {
      baseUrl: path.resolve(fileURLToPath(import.meta.url), '../../site'),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalThis = global as any;
    globalThis.window = window;
    globalThis.fetch = jasmine.createSpy('fetch').and.callFake(async url => {
      return new Response(fs.readFileSync(url).toString());
    });
  });

  const configs = fs.readdirSync(CONFIG_DIR);
  for (const config of configs) {
    if (path.extname(config) !== '.json') continue;

    const input = fs.readFileSync(path.join(CONFIG_DIR, config), 'utf-8');
    const parsedConfig: SampleConfig = JSON.parse(input);

    it(`generated code for ${config} compiles.`, async () => {
      const code = `
        ${await codegen.initializeGpt(parsedConfig, true)}
        ${await codegen.requestAndRenderAds(parsedConfig)}
        ${await codegen.sampleUtilities(parsedConfig)}
        `;

      // Compiler will throw an error is the code is invalid.
      const output = COMPILER.compile(code, 'test.ts');
      expect(output.length).not.toBe(0);
    });
  }
});

describe('Codegen API: config', () => {
  it('returns valid PageSettingsConfig unmodified.', () => {
    const input: googletag.config.PageSettingsConfig = {
      privacyTreatments: {
        treatments: ['disablePersonalization'],
      },
    };

    const output = config.pageConfig(input);
    expect(output).toEqual(input);
  });

  it('returns valid SlotSettingsConfig unmodified.', () => {
    const input: googletag.config.SlotSettingsConfig = {
      interstitial: {
        requireStorageAccess: true,
        triggers: {
          navBar: true,
          unhideWindow: true,
        },
      },
    };

    const output = config.slotConfig(input);
    expect(output).toEqual(input);
  });

  it('returns nothing if the PageSettingsConfig is empty.', () => {
    const input: googletag.config.PageSettingsConfig = {
      privacyTreatments: {
        treatments: [],
      },
    };

    const output = config.pageConfig(input);
    expect(output).toBeNull();
  });

  it('returns nothing if the SlotSettingsConfig is empty.', () => {
    const input: googletag.config.SlotSettingsConfig = {
      interstitial: {},
    };

    const output = config.slotConfig(input);
    expect(output).toBeNull();
  });

  it('removes invalid properties from PageSettingsConfig.', () => {
    const input = {
      privacyTreatments: {
        treatments: ['disablePersonalization'],
      },
      fakeProp: 'no',
    } as googletag.config.PageSettingsConfig;

    const expectedOutput: googletag.config.PageSettingsConfig = {
      privacyTreatments: {
        treatments: ['disablePersonalization'],
      },
    };

    const output = config.pageConfig(input);
    expect(output).toEqual(expectedOutput);
  });

  it('removes invalid properties from SlotSettingsConfig.', () => {
    const input = {
      interstitial: {
        requireStorageAccess: true,
      },
      fakeProp: 'no',
    } as googletag.config.SlotSettingsConfig;

    const expectedOutput: googletag.config.SlotSettingsConfig = {
      interstitial: {
        requireStorageAccess: true,
      },
    };

    const output = config.slotConfig(input);
    expect(output).toEqual(expectedOutput);
  });

  it('prunes empty nested configs of SlotSettingsConfig.', () => {
    const input: googletag.config.SlotSettingsConfig = {
      interstitial: {
        requireStorageAccess: true,
        triggers: {
          navBar: undefined,
          unhideWindow: undefined,
        },
      },
    };

    const expectedOutput: googletag.config.SlotSettingsConfig = {
      interstitial: {
        requireStorageAccess: true,
      },
    };

    const output = config.slotConfig(input);
    expect(output).toEqual(expectedOutput);
  });
});
