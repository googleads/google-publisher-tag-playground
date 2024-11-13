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

import type {SampleSlotConfig} from '../../model/sample-config.js';

export interface SampleAd {
  name: string;
  slot: SampleSlotConfig;
}

export const sampleAds: SampleAd[] = [
  {
    name: 'Fixed-size ad (100x100)',
    slot: {adUnit: '/6355419/Travel/Europe', size: [100, 100]},
  },
  {
    name: 'Fixed-size ad (300x250)',
    slot: {adUnit: '/6355419/Travel/Europe', size: [300, 250]},
  },
  {
    name: 'Fixed-size ad (728x90)',
    slot: {adUnit: '/6355419/Travel/Europe', size: [728, 90]},
  },
  {
    name: 'Fixed-size ad (750x200)',
    slot: {adUnit: '/6355419/Travel/Europe', size: [750, 200]},
  },
  {
    name: 'Multi-size ad',
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
  {name: 'Fluid ad', slot: {adUnit: '/6355419/Travel', size: 'fluid'}},
  {
    name: 'Anchor ad (bottom)',
    slot: {
      adUnit: '/6355419/Travel',
      format: 'BOTTOM_ANCHOR',
      size: [],
      targeting: [{key: 'test', value: 'anchor'}],
    },
  },
  {
    name: 'Anchor ad (top)',
    slot: {
      adUnit: '/6355419/Travel',
      format: 'TOP_ANCHOR',
      size: [],
      targeting: [{key: 'test', value: 'anchor'}],
    },
  },
  {
    name: 'Side rail ad (left)',
    slot: {
      adUnit: '/6355419/Travel/Europe',
      format: 'LEFT_SIDE_RAIL',
      size: [],
    },
  },
  {
    name: 'Side rail ad (right)',
    slot: {
      adUnit: '/6355419/Travel/Europe',
      format: 'RIGHT_SIDE_RAIL',
      size: [],
    },
  },
  {
    name: 'Web interstitial ad',
    slot: {
      adUnit: '/6355419/Travel/Europe/France/Paris',
      format: 'INTERSTITIAL',
      size: [],
    },
  },
];
