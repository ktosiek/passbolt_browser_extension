/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) 2022 Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) 2022 Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         3.9.0
 */
import browser from "webextension-polyfill";
import UserAbortsOperationError from "../../error/userAbortsOperationError";

const AZURE_POPUP_WINDOW_HEIGHT = 600;
const AZURE_POPUP_WINDOW_WIDTH = 380;
const DRY_RUN_SSO_LOGIN_SUCCESS_ENDPOINT = "/sso/login/dry-run/success";
const SSO_LOGIN_SUCCESS_ENDPOINT = "/sso/login/success";
const SSO_LOGIN_SUPPORTED_URLS = [
  'https://login.microsoftonline.com',
  'https://login.microsoftonline.us',
  'https://login.partner.microsoftonline.cn',
];

class AzurePopupHandlerService {
  /**
   * Constructor
   *
   * @param {ApiClientOptions} apiClientOptions
   * @param {number} originTabIdCall id of the tab from where the call has been made
   * @param {boolean} asDryRun does the process is for a dry-run
   * @public
   */
  constructor(accountDomain, originTabIdCall, asDryRun) {
    this.popup = null;
    this.popupTabId = null;
    this.verifyCodeInTab = this.verifyCodeInTab.bind(this);
    this.verifyPopupClosed = this.verifyPopupClosed.bind(this);
    const endpoint = asDryRun ? DRY_RUN_SSO_LOGIN_SUCCESS_ENDPOINT : SSO_LOGIN_SUCCESS_ENDPOINT;
    this.expectedUrl = `${accountDomain}${endpoint}`;
    this.originTabIdCall = originTabIdCall;
  }

  /**
   * Run the third-party SSO provider Sign in and get back a tiken once successfully finished
   * @param {URL} popupUrl the url for opening the popup
   * @returns {Promise<void>}
   * @public
   */
  async getSsoTokenFromThirdParty(popupUrl) {
    this.popup = await this.openPopup(popupUrl.toString());
    this.popupTabId = this.popup.tabs[0].id;

    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;

      browser.tabs.onUpdated.addListener(this.verifyCodeInTab);
      browser.tabs.onRemoved.addListener(this.verifyPopupClosed);
    });
  }

  /**
   * Popup's tab URL change handler to verify we obtained the third party code.
   * @returns {void}
   * @private
   */
  async verifyCodeInTab(tabId, changeInfo, tab) {
    if (tabId === this.originTabIdCall) {
      this.rejectPromise(new UserAbortsOperationError("The user navigated away from the tab where the SSO sign-in initiated"));
      await this.closeHandler();
      return;
    }

    if (tabId !== this.popupTabId) {
      return;
    }

    if (tab.status !== "complete") {
      return;
    }

    const code = this.grabCodeFromHash(tab.url);
    if (code !== null) {
      this.resolvePromise(code);
    }
  }

  /**
   * Tab removal handler.
   * In this method we observe if:
   *  - the SSO sign in popup has been closed by the user
   *  - the tab from where the SSO sign in has been initiated has been closed by the user
   * In both case, we cancel the SSO sign in process.
   *
   * @param {number} tabId the tab identifier where the event happens
   * @returns {void}
   * @private
   */
  async verifyPopupClosed(tabId) {
    if (tabId === this.originTabIdCall) {
      this.rejectPromise(new UserAbortsOperationError("The user closed the tab from where the SSO sign-in initiated"));
      await this.closeHandler();
    } else if (tabId === this.popupTabId) {
      this.rejectPromise(new UserAbortsOperationError("The user closed the SSO sign-in popup"));
    }
  }

  /**
   * Closes the current popup opened by the handler if any.
   * @returns {Promise<void>}
   * @public
   */
  async closeHandler() {
    browser.tabs.onUpdated.removeListener(this.verifyCodeInTab);
    browser.tabs.onRemoved.removeListener(this.verifyPopupClosed);
    this.rejectPromise = null;
    this.resolvePromise = null;
    this.codeFound = null;

    if (this.popup && !this.popup.closed) {
      browser.tabs.remove(this.popupTabId);
    }
    this.popup = null;
  }

  /**
   * Open the third party SSO authentication popup
   * @param {string} url the url for the popup to point at
   * @return {Promise<windows.Window>}
   * @private
   */
  async openPopup(url) {
    this.assertSsoLoginUrl(url);

    const type = "popup";
    const width = AZURE_POPUP_WINDOW_WIDTH;
    const height = AZURE_POPUP_WINDOW_HEIGHT;

    const windowCreateData = {url, type, width, height};
    return await browser.windows.create(windowCreateData);
  }

  /**
   * Assert that an url is a supported sso login url.
   * @param {string} url the url for the popup to point at
   * @throw {Error} If the url is not supported
   * @return {void}
   * @private
   */
  assertSsoLoginUrl(url) {
    const isSupportedUrl = SSO_LOGIN_SUPPORTED_URLS.some(supportedUrl => url.startsWith(supportedUrl));
    if (!isSupportedUrl) {
      throw new Error('Unsupported single sign-on login url');
    }
  }

  /**
   * Tries to extract a well-formatted third party code from a URL's hash.
   * @param {string} url the url from which to extract the code
   * @return {string|null}
   * @private
   */
  grabCodeFromHash(url) {
    if (!url.startsWith(this.expectedUrl)) {
      return null;
    }
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get('token') || null;
    return code;
  }
}

export default AzurePopupHandlerService;
