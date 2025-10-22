/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {msg, str} from '@lit/localize';

import {SampleConfig, SampleSlotConfig} from '../../model/sample-config.js';
import {outOfPageFormatNames} from '../../model/settings.js';
import * as googletag from '../api/googletag.js';
import * as pubads from '../api/pubads.js';

import {SampleHelper} from './sample-helper.js';

const MODAL_ID = 'rewardedModal';
const PAYLOAD_ID = 'rewardPayload';

const api = {
  declarePayload: () => `let ${PAYLOAD_ID}: googletag.RewardedPayload | null`,
  makeRewardedVisible: () => 'event.makeRewardedVisible()',
  showConsentDialog: (codeIfYes: string, codeIfNo: string) =>
    `${MODAL_ID}.showConsentDialog(() => {${codeIfYes}}, () => {${codeIfNo}})`,
  showReward: () => `if (${PAYLOAD_ID}) ${MODAL_ID}.showReward(${PAYLOAD_ID})`,
  storePayload: () => `${PAYLOAD_ID} = event.payload`,
};

const strings = {
  adActive: () =>
    msg(str`${strings.format()} is active.`, {
      desc: 'Status message: The rewarded ad is currently being viewed.',
    }),
  adClosed: () =>
    msg(str`${strings.format()} was closed.`, {
      desc: 'Status message: The rewarded ad has been closed by the user.',
    }),
  adReady: () =>
    msg(str`${strings.format()} slot is ready.`, {
      desc: 'Status message: The rewarded ad is ready to be displayed.',
    }),
  consetComment: () =>
    msg('Display the rewarded ad if the user consents.', {
      desc: 'Comment identifying code executed when the user consents.',
    }),
  consentPromptComment: () =>
    msg('Prompt the user for their consent to view the rewarded ad.', {
      desc: 'Comment identifying code executed to request user consent.',
    }),
  dialogButtonClose: () => msg('Close', {desc: 'Close button text.'}),
  dialogButtonNo: () => msg('No', {desc: 'No button text.'}),
  dialogButtonYes: () => msg('Yes', {desc: 'Yes button text.'}),
  dialogConsent: () =>
    msg('Watch an ad to receive a special reward?', {
      desc: 'Consent prompt displayed to users.',
    }),
  dialogReward: (amount: string, type: string) =>
    msg(str`You have been rewarded ${amount} ${type}!`, {
      desc: 'Message displayed when a user recieves a reward for watching an ad.',
    }),
  format: () => outOfPageFormatNames.REWARDED(),
  noConsent: () =>
    msg(str`${strings.format()} prompt was dismissed.`, {
      desc: 'Status message: User dismissed the rewarded ad consent prompt.',
    }),
  noConsentComment: () =>
    msg('Destroy the rewarded ad slot if the user does not consent.', {
      desc: 'Comment identifying code executed when the user does not consent.',
    }),
  rewardGranted: () =>
    msg('Reward granted.', {
      desc: 'Status message: User received a reward for viewing an ad.',
    }),
};

/**
 * Provides event listeners and utility code necessary to implement Rewarded
 * ads.
 */
class RewardedAds extends SampleHelper {
  private rewardedModalCode?: string;

  private rewardedSlotClosedCallback(
    config: SampleConfig,
    slotConfig: SampleSlotConfig,
  ) {
    return `
      ${api.showReward()};
      ${googletag.destroySlot(config, slotConfig)};
      ${googletag.updateStatus(config, slotConfig, strings.adClosed())};
    `;
  }

  private rewardedSlotGrantedCallback(
    config: SampleConfig,
    slotConfig: SampleSlotConfig,
  ) {
    return `
      ${api.storePayload()};
      ${googletag.updateStatus(config, slotConfig, strings.rewardGranted())};
    `;
  }

  private rewardedSlotReadyCallback(
    config: SampleConfig,
    slotConfig: SampleSlotConfig,
  ) {
    return `
      ${googletag.updateStatus(config, slotConfig, strings.adReady())};

      // ${strings.consentPromptComment()}
      ${api.showConsentDialog(
        // If user provides consent...
        `
          // ${strings.consetComment()}
          ${api.makeRewardedVisible()};
          ${googletag.updateStatus(config, slotConfig, strings.adActive())};
        `,
        // If user doesn't consent...
        `
          // ${strings.noConsentComment()}
          ${googletag.destroySlot(config, slotConfig)};
          ${googletag.updateStatus(config, slotConfig, strings.noConsent())};
        `,
      )}
    `;
  }

  override exports() {
    return [MODAL_ID];
  }

  override globalDeclarations() {
    return [`${api.declarePayload()};`];
  }

  override slotEventListeners(
    config: SampleConfig,
    slotConfig: SampleSlotConfig,
  ) {
    return [
      `${pubads.addEventListener(
        'rewardedSlotReady',
        this.rewardedSlotReadyCallback(config, slotConfig),
      )};`,
      `${pubads.addEventListener(
        'rewardedSlotClosed',
        this.rewardedSlotClosedCallback(config, slotConfig),
      )};`,
      `${pubads.addEventListener(
        'rewardedSlotGranted',
        this.rewardedSlotGrantedCallback(config, slotConfig),
      )};`,
    ];
  }

  override async utilities() {
    // Return the rewarded modal utility code.
    return [
      // Inject localized dialog messages.
      `window.rewardedModalMsg = {
        buttonClose: '${strings.dialogButtonClose()}',
        buttonNo: '${strings.dialogButtonNo()}',
        buttonYes: '${strings.dialogButtonYes()}',
        consentPrompt: '${strings.dialogConsent()}',
        reward: (amount: number, type: string) => \`${strings.dialogReward(
          '${amount}',
          '${type}',
        )}\`,
      }`,
      await this.fetchStaticInclude('rewarded-modal.ts'),
    ];
  }
}

// Export RewardedAds singleton.
export const rewardedAdsHelper = new RewardedAds();
