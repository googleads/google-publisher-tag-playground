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

import {SampleSlotConfig} from '../src/model/sample-config.js';
import {ScriptTarget} from '../src/model/typescript.js';
import {window} from '../src/model/window.js';
import * as base64url from '../src/util/base64url.js';
import {formatHtml, formatTypeScript} from '../src/util/format-code.js';
import {getLocale, setLocale} from '../src/util/localization-utils.js';
import {PlaygroundConfig} from '../src/util/playground-config.js';
import {getSlotStyles} from '../src/util/template-utils.js';
import {tsToJs} from '../src/util/transpile-code.js';

import {transpileTestCases} from './util-test-data/transpile-test-cases.js';

describe('Utility', () => {
  function unformat(input: string) {
    return input.trim().replace(/[\n|\s]/g, '');
  }

  describe('base64url', () => {
    const ascii = 'AEIOU';
    const asciiBase64 = 'QUVJT1U';

    const unicode = 'あいうえお';
    const unicodeBase64 = '44GC44GE44GG44GI44GK';

    it('encodes to base64', () => {
      expect(base64url.encode(ascii)).toEqual(asciiBase64);
    });

    it('encodes unicode to base64', () => {
      expect(base64url.encode(unicode)).toEqual(unicodeBase64);
    });

    it('decodes from base64', () => {
      expect(base64url.decode(asciiBase64)).toEqual(ascii);
    });

    it('decodes unicode from base64', () => {
      expect(base64url.decode(unicodeBase64)).toEqual(unicode);
    });

    it('encode trims padding characters', () => {
      const input = 'A'; // base64('A') -> 'QQ=='
      expect(base64url.encode(input)).not.toContain('=');
    });

    it('encode converts "+" chars', () => {
      const input = '<><><>'; // base64('<><><>') -> 'PD48Pjw+'
      const expectedOutput = 'PD48Pjw-';
      expect(base64url.encode(input)).toEqual(expectedOutput);
    });

    it('encode converts "/" chars', () => {
      const input = '???'; // base64('???') -> 'Pz8/'
      const expectedOutput = 'Pz8_';
      expect(base64url.encode(input)).toEqual(expectedOutput);
    });

    it('encode + decode returns the same string', () => {
      const input = 'this is a test string';
      const output = base64url.decode(base64url.encode(input));
      expect(output).toEqual(input);
    });
  });

  describe('format-code', () => {
    function testFormatting(input: string, output: string) {
      // Ensure the formatter did something (not validating specific rules).
      expect(input.trim()).not.toEqual(output.trim());

      // Ensure that character content hasn't changed.
      expect(unformat(input)).toEqual(unformat(output));
    }

    it('formats HTML', async () => {
      const input =
        '<html><head><title>test</title></head><body></body></html>';
      testFormatting(input, await formatHtml(input));
    });

    it('formats CSS in HTML', async () => {
      const input =
        '<style>.class { color: red; } #id { display: block; }</style>';
      testFormatting(input, await formatHtml(input));
    });

    it('formats JS in HTML', async () => {
      const input = '<script>function foo() { return bar; }</script>';
      testFormatting(input, await formatHtml(input));
    });

    it('formats TS', async () => {
      const input = 'function foo(bar: string): boolean { return false; }';
      testFormatting(input, await formatTypeScript(input));
    });
  });

  describe('localization-utils', () => {
    it('successfully handles a supported locale', () => {
      const locale = 'en';

      spyOn(console, 'info');
      setLocale(locale);
      expect(getLocale()).toEqual(locale);
      expect(console.info).toHaveBeenCalled();
    });

    it('reports an error for unsupported locales', () => {
      const startingLocale = 'en';
      setLocale(startingLocale);

      spyOn(console, 'error');
      setLocale('invalid');
      expect(getLocale()).toEqual(startingLocale);
      expect(console.error).toHaveBeenCalled();
    });

    it('is case-insensitive', () => {
      const locale = 'EN';

      spyOn(console, 'info');
      spyOn(console, 'error');
      setLocale(locale);
      expect(getLocale().toLowerCase()).toEqual(locale.toLowerCase());
      expect(console.info).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(0);
    });
  });

  describe('template-utils', () => {
    function getSlotConfig(size: googletag.GeneralSize): SampleSlotConfig {
      return {adUnit: '/123/abc', size};
    }

    it('handles googletag.SinglSize', () => {
      const output = getSlotStyles(getSlotConfig([100, 200]));
      expect(output).toContain('min-height: 200px');
      expect(output).toContain('min-width: 100px');
    });

    it('handles googletag.NamedSize', () => {
      const output = getSlotStyles(getSlotConfig('fluid'));
      expect(output).toContain('min-width: 50%');
    });

    it('handles googletag.MultiSize', () => {
      const input: googletag.MultiSize = [
        [100, 200],
        [200, 100],
      ];
      const output = getSlotStyles(getSlotConfig(input));
      expect(output).toContain('min-height: 100px');
      expect(output).toContain('min-width: 100px');
    });

    it('handles googletag.NamedSize in googletag.Multisize', () => {
      const input: googletag.MultiSize = [
        [100, 200],
        ['fluid'],
        'fluid',
        [200, 100],
      ];
      const output = getSlotStyles(getSlotConfig(input));
      expect(output).toContain('min-height: 100px');
      expect(output).toContain('min-width: 100px');
    });
  });

  describe('transpile-code', () => {
    Object.keys(transpileTestCases).forEach(testCase => {
      it(`handles "${testCase}"`, () => {
        const testData = transpileTestCases[testCase];

        const typescript = testData.typescript.trim();
        const es5 = tsToJs(typescript, ScriptTarget.ES5);
        const es2020 = tsToJs(typescript, ScriptTarget.ES2020);

        expect(unformat(es5)).toEqual(unformat(testData.es5));
        expect(unformat(es2020)).toEqual(unformat(testData.es2020));
      });
    });
  });

  describe('playground-config', () => {
    afterEach(() => {
      window.playgroundConfig = {};
    });

    beforeEach(() => {
      window.playgroundConfig = {};
    });

    it('retrieves values from global config', () => {
      const testConfig = {
        config: '123',
        locale: 'de',
        preview: false,
        sample: '456',
      };

      window.playgroundConfig = {...testConfig};

      expect(PlaygroundConfig.locale).toEqual(testConfig.locale);
      expect(PlaygroundConfig.preview).toEqual(testConfig.preview);
      expect(PlaygroundConfig.sample).toEqual(testConfig.sample);
      expect(PlaygroundConfig.sampleConfigHash).toEqual(testConfig.config);
    });

    it('retrieves values from URL hash', () => {
      const testConfig = {
        config: 'abc',
        locale: 'fr',
        preview: false,
        sample: 'def',
      };

      window.location = jasmine.createSpyObj('location', [], {
        hash: `#config=${testConfig.config}&hl=${testConfig.locale}&preview=${
          testConfig.preview
        }&sample=${testConfig.sample}`,
      });

      expect(PlaygroundConfig.locale).toEqual(testConfig.locale);
      expect(PlaygroundConfig.preview).toEqual(testConfig.preview);
      expect(PlaygroundConfig.sample).toEqual(testConfig.sample);
      expect(PlaygroundConfig.sampleConfigHash).toEqual(testConfig.config);
    });

    it('prefers global config over URL hash', () => {
      const testConfig = {
        config: '123',
        locale: 'de',
        preview: false,
        sample: '456',
      };

      window.playgroundConfig = {...testConfig};

      window.location = jasmine.createSpyObj('location', [], {
        hash: '#config=abc&hl=fr&preview=true&sample=def',
      });

      expect(PlaygroundConfig.locale).toEqual(testConfig.locale);
      expect(PlaygroundConfig.preview).toEqual(testConfig.preview);
      expect(PlaygroundConfig.sample).toEqual(testConfig.sample);
      expect(PlaygroundConfig.sampleConfigHash).toEqual(testConfig.config);
    });

    it('returns expected defaults', () => {
      window.location = jasmine.createSpyObj('location', [], {hash: ''});

      expect(PlaygroundConfig.locale).toEqual('en');
      expect(PlaygroundConfig.preview).toBeTrue();
      expect(PlaygroundConfig.sample).toBeNull();
      expect(PlaygroundConfig.sampleConfigHash).toBeNull();
    });

    it('sets state as expected', () => {
      window.location = jasmine.createSpyObj('location', [], {hash: ''});

      window.history = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        replaceState: (...args) => {},
      } as History;
      const replaceStateSpy = spyOn(window.history, 'replaceState');

      const testConfig = {
        locale: 'de',
        preview: false,
        sample: 'abc',
        sampleConfig: 'def',
      };

      PlaygroundConfig.locale = testConfig.locale;
      expect(PlaygroundConfig.locale).toEqual(testConfig.locale);
      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        '',
        `#hl=${testConfig.locale}`,
      );

      PlaygroundConfig.preview = testConfig.preview;
      expect(PlaygroundConfig.preview).toEqual(testConfig.preview);
      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        '',
        `#preview=${testConfig.preview}`,
      );

      PlaygroundConfig.sample = testConfig.sample;
      expect(PlaygroundConfig.sample).toEqual(testConfig.sample);
      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        '',
        `#sample=${testConfig.sample}`,
      );

      PlaygroundConfig.sampleConfigHash = testConfig.sampleConfig;
      expect(PlaygroundConfig.sampleConfigHash).toEqual(
        testConfig.sampleConfig,
      );
      expect(replaceStateSpy).toHaveBeenCalledWith(
        null,
        '',
        `#config=${testConfig.sampleConfig}`,
      );
    });
  });

  it('base URL is handled correctly', () => {
    window.location = jasmine.createSpyObj('location', [], {
      origin: 'https://www.example.com',
      hash: '#config=abc&hl=de',
      pathname: '/subdir/configurator',
    });

    expect(PlaygroundConfig.baseUrl).toEqual('https://www.example.com/subdir');

    window.playgroundConfig = {
      baseUrl: 'https://www.example2.com/',
    };

    expect(PlaygroundConfig.baseUrl).toEqual('https://www.example2.com');
  });
});
