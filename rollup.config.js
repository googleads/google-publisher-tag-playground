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

import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import {importMetaAssets} from '@web/rollup-plugin-import-meta-assets';
import {glob} from 'glob';
import copy from 'rollup-plugin-copy';
import {minify} from 'rollup-plugin-esbuild';
import minifyHTML from 'rollup-plugin-minify-html-literals-v3';
import summary from 'rollup-plugin-summary';

const MINIFY_HTML_OPTIONS = {
  options: {
    shouldMinifyCSS: template => {
      return (
        template.tag &&
        template.tag === 'css' &&
        // Skip any CSS containing statements that are unsupported
        // by the version of clean-css this plugin is locked to.
        !template.parts.some(part => part.text.match('@layer'))
      );
    },
  },
};

const isWatching = process.env.ROLLUP_WATCH === 'true';

// Process direct includes in a single config to bundle with dependencies.
const includes = {
  input: glob.sync('build/site/includes/*.js'),
  output: {
    dir: 'dist/includes/',
    format: 'es',
  },
  plugins: [
    resolve(),
    !isWatching && minifyHTML(MINIFY_HTML_OPTIONS),
    !isWatching && minify(),
  ].filter(Boolean),
};

// Process locale files in a single config to avoid duplicate pipeline overhead.
const locales = {
  input: glob.sync('build/src/generated/locales/*.js'),
  output: {
    dir: 'dist/locales/',
    format: 'es',
  },
  plugins: [resolve(), !isWatching && minify()].filter(Boolean),
};

// Process TypeScript seperately so it can be treated as an external dependency
// in other configs. This speeds up incremental build times significantly.
const typescriptChunk = {
  input: 'node_modules/typescript/lib/typescript.js',
  output: {
    file: 'dist/js/typescript.js',
    format: 'es',
    exports: 'default',
  },
  plugins: [
    commonjs({
      ignore: () => true,
    }),
    resolve(),
    !isWatching && minify(),
    !isWatching &&
      summary({
        showBrotliSize: true,
        showGzippedSize: true,
      }),
  ].filter(Boolean),
};

export default [
  {
    input: glob.sync('build/site/js/*.js'),
    external: ['typescript'],
    output: {
      dir: 'dist/js',
      format: 'es',
      paths: {
        typescript: './typescript.js',
      },
      // Manually split dependencies into logical chunks, to aid debugging.
      manualChunks: id => {
        const lib = id.replace(/^.*[\\/]node_modules[\\/]/, '');
        if (lib.startsWith('lit')) {
          return 'lit';
        }
        if (lib.startsWith('playground')) {
          return 'playground-elements';
        }
        if (lib.startsWith('prettier')) {
          return 'prettier';
        }
      },
      chunkFileNames: '[name].js',
    },
    plugins: [
      resolve(),
      importMetaAssets(),
      !isWatching && minifyHTML(MINIFY_HTML_OPTIONS),
      copy({
        targets: [
          {
            src: ['site/*', '!site/includes/*.js', '!site/js'],
            dest: 'dist',
          },
        ],
        flatten: false,
      }),
      !isWatching && minify(),
      !isWatching &&
        summary({
          showBrotliSize: true,
          showGzippedSize: true,
        }),
    ].filter(Boolean),
  },
  includes,
  locales,
  typescriptChunk,
];
