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

export const rewardedModal = new (class {
  dialog: HTMLDialogElement;

  callbackIfNo?: () => void;
  callbackIfYes?: () => void;

  constructor() {
    this.dialog = document.createElement('dialog');

    this.dialog.addEventListener('close', () => {
      if (this.dialog.returnValue === 'yes') {
        this.callbackIfYes?.();
      } else {
        this.callbackIfNo?.();
        this.callbackIfNo = this.callbackIfYes = undefined;
      }
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(this.dialog);
      });
    } else {
      document.body.appendChild(this.dialog);
    }
  }

  showConsentDialog(callbackIfYes: () => void, callbackIfNo: () => void) {
    this.callbackIfNo = callbackIfNo;
    this.callbackIfYes = callbackIfYes;
    this.showDialog(window.rewardedModalMsg.consentPrompt);
  }

  showReward({amount, type}: googletag.RewardedPayload) {
    this.callbackIfNo = this.callbackIfYes = undefined;
    if (amount && type)
      this.showDialog(window.rewardedModalMsg.reward(amount, type), true);
  }

  private showDialog(message: string, rewardReceived = false) {
    this.dialog.textContent = message;

    const form = document.createElement('form');
    const buttons = form.appendChild(document.createElement('div'));
    buttons.style.cssText =
      'display: flex; justify-content: space-evenly; padding-top: 15px;';

    if (rewardReceived) {
      buttons.appendChild(
        this.createButton(window.rewardedModalMsg.buttonClose),
      );
    } else {
      buttons.appendChild(
        this.createButton(window.rewardedModalMsg.buttonYes, 'yes'),
      );
      buttons.appendChild(this.createButton(window.rewardedModalMsg.buttonNo));
    }

    this.dialog.appendChild(form);
    this.dialog.showModal();
  }

  private createButton(text: string, value = text) {
    const button = document.createElement('button');
    button.formMethod = 'dialog';
    button.textContent = text;
    button.value = value;

    return button;
  }
})();

declare global {
  interface Window {
    rewardedModalMsg: {
      buttonClose: string;
      buttonNo: string;
      buttonYes: string;
      consentPrompt: string;
      reward: (amount: number, type: string) => string;
    };
  }
}
