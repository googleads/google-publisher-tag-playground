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

import {msg} from '@lit/localize';

import type {SampleSlotConfig} from './sample-config.js';
import {outOfPageFormatNames} from './settings.js';

export interface SampleAd {
  name: () => string;
  slot: SampleSlotConfig;
}

export const sampleAds: SampleAd[] = [
  {
    name: () =>
      msg('Fixed-size ad (100x100)', {
        desc: 'A sample ad with one valid size.',
      }),
    slot: {adUnit: '/6355419/Travel/Europe', size: [100, 100]},
  },
  {
    name: () =>
      msg('Fixed-size ad (300x250)', {desc: 'A sample ad with one valid size'}),
    slot: {adUnit: '/6355419/Travel/Europe', size: [300, 250]},
  },
  {
    name: () =>
      msg('Fixed-size ad (728x90)', {desc: 'A sample ad with one valid size'}),
    slot: {adUnit: '/6355419/Travel/Europe', size: [728, 90]},
  },
  {
    name: () =>
      msg('Fixed-size ad (750x200)', {desc: 'A sample ad with one valid size'}),
    slot: {adUnit: '/6355419/Travel/Europe', size: [750, 200]},
  },
  {
    name: () =>
      msg('Multi-size ad', {desc: 'A sample ad with multiple valid sizes'}),
    slot: {
      adUnit: '/6355419/Travel/Europe',
      size: [
        [100, 100],
        [300, 250],
        [728, 90],
        [750, 200],
      ],
    },
  },
  {
    name: () =>
      msg('Fluid ad', {
        desc: 'A sample native ad, which resizes to fit the space available.',
      }),
    slot: {adUnit: '/6355419/Travel', size: 'fluid'},
  },
  {
    name: outOfPageFormatNames.BOTTOM_ANCHOR,
    slot: {
      adUnit: '/6355419/Travel',
      config: {
        targeting: {
          test: 'anchor',
        },
      },
      format: 'BOTTOM_ANCHOR',
      size: [],
    },
  },
  {
    name: outOfPageFormatNames.TOP_ANCHOR,
    slot: {
      adUnit: '/6355419/Travel',
      config: {
        targeting: {
          test: 'anchor',
        },
      },
      format: 'TOP_ANCHOR',
      size: [],
    },
  },
  {
    name: outOfPageFormatNames.REWARDED,
    slot: {
      adUnit: '/22639388115/rewarded_web_example',
      format: 'REWARDED',
      size: [],
    },
  },
  {
    name: outOfPageFormatNames.LEFT_SIDE_RAIL,
    slot: {
      adUnit: '/6355419/Travel/Europe',
      format: 'LEFT_SIDE_RAIL',
      size: [],
    },
  },
  {
    name: outOfPageFormatNames.RIGHT_SIDE_RAIL,
    slot: {
      adUnit: '/6355419/Travel/Europe',
      format: 'RIGHT_SIDE_RAIL',
      size: [],
    },
  },
  {
    name: outOfPageFormatNames.INTERSTITIAL,
    slot: {
      adUnit: '/6355419/Travel/Europe/France/Paris',
      format: 'INTERSTITIAL',
      size: [],
    },
  },
];
