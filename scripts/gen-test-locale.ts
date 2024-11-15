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

import * as fs from 'fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const INPUT_LOCALE = 'en';
const OUTPUT_LOCALE = 'test';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const XLB_DIR = path.resolve(CURRENT_DIR, '../data/localization');
const INPUT_XLB = path.join(XLB_DIR, `${INPUT_LOCALE}.xlb`);
const OUTPUT_XLB = path.join(XLB_DIR, `${OUTPUT_LOCALE}.xlb`);

(() => {
  const inputContent = fs.readFileSync(INPUT_XLB).toString();

  const outputContent = inputContent
    .replace(/(<msg.*>)(.+)(<\/msg>)/gim, (match, p1, p2, p3) => {
      // Add alternating diacritical marks to each character.
      // First regex replaces odd characters, second replaces even.
      let accentedStr = p2.replace(/([a-z])([a-z])?/gim, '$1\u0301$2');
      accentedStr = accentedStr.replace(/([a-z])/gim, '$1\u0302');
      return `${p1}${accentedStr}${p3}`;
    })
    .replace(`locale="${INPUT_LOCALE}"`, `locale="${OUTPUT_LOCALE}"`);

  const output = fs.createWriteStream(OUTPUT_XLB);
  output.write(outputContent);
})();
