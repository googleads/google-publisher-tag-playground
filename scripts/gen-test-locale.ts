/**
 * Copyright 2024 Google LLC
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

import {DOMParser, XMLSerializer} from '@xmldom/xmldom';
import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const INPUT_LOCALE = 'en';
const OUTPUT_LOCALE = 'test';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const XLB_DIR = path.resolve(CURRENT_DIR, '../data/localization');
const INPUT_XLB = path.join(XLB_DIR, `${INPUT_LOCALE}.xlb`);
const OUTPUT_XLB = path.join(XLB_DIR, `${OUTPUT_LOCALE}.xlb`);

/**
 * Parses the EN translation (XLB) file, adds diacritical marks to
 * each alphabetic character in every message, and outputs the
 * result as a new test translation file. This is then used to test
 * that mesages are rendered correctly in non-EN locales during
 * development.
 */
(() => {
  const inputContent = fs.readFileSync(INPUT_XLB).toString();
  const doc = new DOMParser().parseFromString(inputContent, 'text/xml');

  for (let elem of doc.getElementsByTagName('msg')) {
    for (let child of elem.childNodes) {
      if (child.nodeType === doc.TEXT_NODE && child.textContent) {
        let accentedStr = child.textContent;

        // Add alternating diacritical marks to each character.
        // First regex replaces odd characters, second replaces even.
        accentedStr = accentedStr.replace(/([a-z])([a-z])?/gim, '$1\u0301$2');
        accentedStr = accentedStr.replace(/([a-z])/gim, '$1\u0302');

        child.textContent = accentedStr;
      }
    }
  }

  const outputContent = new XMLSerializer().serializeToString(doc).replace(
      `locale="${INPUT_LOCALE}"`, `locale="${OUTPUT_LOCALE}"`);
  fs.createWriteStream(OUTPUT_XLB).write(outputContent);
})();
