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

import * as fs from 'fs';
import * as path from 'path';
import {ProjectManifest} from 'playground-elements/shared/worker-api.js';
import {fileURLToPath} from 'url';

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));

const INPUT_DIR = path.resolve(CURRENT_DIR, '../samples/dist');
const OUTPUT_DIR = path.resolve(CURRENT_DIR, '../dist/config');

const SUPPORTED_LANGUAGES = ['js', 'ts'];

(() => {
  try {
    // Ensure the output directory exists.
    fs.mkdirSync(OUTPUT_DIR, {recursive: true});

    // Iterate through the samples and generate config files for each
    // supported language.
    fs.readdirSync(INPUT_DIR).forEach(file => {
      const filePath = path.join(INPUT_DIR, file);
      if (!fs.statSync(filePath).isDirectory()) return;

      SUPPORTED_LANGUAGES.forEach((lang) => writeConfig(file, lang));
    });
  } catch (e) {
    console.error(e);
  }
})();

/**
 * Write a config file for the specified sample and language.
 *
 * @param sample
 * @param format
 * @returns
 */
function writeConfig(sample: string, format: string) {
  const samplePath = path.join(INPUT_DIR, sample, format);
  if (!fs.existsSync(samplePath)) return;

  const files = fs.readdirSync(samplePath);

  const config: ProjectManifest = {'files': {}};
  files
      .filter(
          // We only display HTML and TS files in the editor.
          // JS samples are assumed to be single page HTML + JS combined.
          f => f.endsWith('.html') || f.endsWith('.ts'))
      .forEach(f => {
        const filePath = path.join(samplePath, f);

        // For simplicity, name all HTML files index.html.
        // This allows us to use default values for <playground-preview>.
        // This is safe as long as all samples are comprised of exactly 1 HTML
        // file.
        const id = f.endsWith('.html') ? 'index.html' : f;

        config.files![id] = {'content': prepareContent(filePath)};
      });

  // Add hidden GPT type dependency for TS samples.
  // This enables code completion and error checking in the editor.
  if (format === 'ts') {
    config.files!['package.json'] = {
      'content': '{"dependencies": {"@types/google-publisher-tag": "^1.0.0"}}',
      'hidden': true
    };
  }

  const fileName = `${sample}-${format}.json`;
  console.log(`Writing: ${fileName}`);

  const outPath = path.join(OUTPUT_DIR, fileName);
  const output = fs.createWriteStream(outPath);
  output.write(JSON.stringify(config));
}

/**
 * Rewrite sample content to work in the playground.
 *
 * @param file The sample file to rewrite.
 * @returns Rewritten sample contents.
 */
function prepareContent(file: string) {
  const content = fs.readFileSync(file).toString();
  return content.replace('src="/', 'src="./').replace('.ts"', '.js"');
}