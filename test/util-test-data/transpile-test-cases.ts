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

interface TestCases {
  [key: string]: {typescript: string; es5: string; es2020: string};
}

/**
 * Tests cases for `src/util/transpile-code.ts`
 */
export const transpileTestCases: TestCases = {
  'arrow function': {
    typescript: `
      googletag.cmd.push(() => {
          googletag.display('div-1');
      });`,
    es5: `
      googletag.cmd.push(function () {
          googletag.display('div-1');
      });`,
    es2020: `
      googletag.cmd.push(() => {
          googletag.display('div-1');
      });`,
  },
  const: {
    typescript: `
      const slot = googletag
        .defineSlot('/1234567/sports', [160, 600], 'div')!
        .set('adsense_background_color', '#FFFFFF')
        .addService(googletag.pubads());`,
    es5: `
      var slot = googletag
        .defineSlot('/1234567/sports', [160, 600], 'div')
        .set('adsense_background_color', '#FFFFFF')
        .addService(googletag.pubads());`,
    es2020: `
      const slot = googletag
        .defineSlot('/1234567/sports', [160, 600], 'div')
        .set('adsense_background_color', '#FFFFFF')
        .addService(googletag.pubads());`,
  },
  'non-null assert': {
    typescript: `
      googletag
        .defineSlot('/1234567/sports', [160, 600])!
        .addService(googletag.pubads());`,
    es5: `
      googletag
        .defineSlot('/1234567/sports', [160, 600])
        .addService(googletag.pubads());`,
    es2020: `
      googletag
        .defineSlot('/1234567/sports', [160, 600])
        .addService(googletag.pubads());`,
  },
  'type annotation': {
    typescript: `
      const listner = (event: googletag.events.ImpressionViewableEvent) => {
        googletag.pubads().removeEventListener('impressionViewable', listner);
        setTimeout(() => {
            googletag.pubads().refresh([event.slot]);
        }, 30000);
      };`,
    es5: `
      var listner = function(event) {
        googletag.pubads().removeEventListener('impressionViewable', listner);
        setTimeout(function() {
            googletag.pubads().refresh([event.slot]);
        }, 30000);
      };`,
    es2020: `
      const listner = (event) => {
        googletag.pubads().removeEventListener('impressionViewable', listner);
        setTimeout(() => {
            googletag.pubads().refresh([event.slot]);
        }, 30000);
      };`,
  },
};
