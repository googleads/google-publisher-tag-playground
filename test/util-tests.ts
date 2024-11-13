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

import ts from 'typescript';

import {SampleSlotConfig} from '../src/model/sample-config.js';
import * as base64url from '../src/util/base64url.js';
import {formatHtml, formatTypeScript} from '../src/util/format-code.js';
import {getLocale, setLocale} from '../src/util/localization-utils.js';
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
      const input = 'A';  // base64('A') -> 'QQ=='
      expect(base64url.encode(input)).not.toContain('=');
    });

    it('encode converts "+" chars', () => {
      const input = '<><><>';  // base64('<><><>') -> 'PD48Pjw+'
      const expectedOutput = 'PD48Pjw-';
      expect(base64url.encode(input)).toEqual(expectedOutput);
    });

    it('encode converts "/" chars', () => {
      const input = '???';  // base64('???') -> 'Pz8/'
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
      const input: googletag.MultiSize = [[100, 200], [200, 100]];
      const output = getSlotStyles(getSlotConfig(input));
      expect(output).toContain('min-height: 100px');
      expect(output).toContain('min-width: 100px');
    });

    it('handles googletag.NamedSize in googletag.Multisize', () => {
      const input: googletag.MultiSize =
          [[100, 200], ['fluid'], 'fluid', [200, 100]];
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
        const es5 = tsToJs(typescript, ts.ScriptTarget.ES5);
        const es2020 = tsToJs(typescript, ts.ScriptTarget.ES2020);

        expect(unformat(es5)).toEqual(unformat(testData.es5));
        expect(unformat(es2020)).toEqual(unformat(testData.es2020));
      });
    });
  });
});