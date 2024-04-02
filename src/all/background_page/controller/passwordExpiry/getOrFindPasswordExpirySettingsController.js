/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         4.4.0
 */
import PasswordExpirySettingsGetOrFindService
  from "../../service/passwordExpirySettings/passwordExpirySettingsGetOrFindService";

class GetOrFindPasswordExpirySettingsController {
  /**
   * GetOrFindPasswordExpirySettingsController constructor
   * @param {Worker} worker
   * @param {string} requestId uuid
   * @param {AccountEntity} account the user account
   * @param {ApiClientOptions} apiClientOptions the api client options
   */
  constructor(worker, requestId, account, apiClientOptions) {
    this.worker = worker;
    this.requestId = requestId;
    this.passwordExpirySettingsGetOrFindService = new PasswordExpirySettingsGetOrFindService(account, apiClientOptions);
  }

  /**
   * Controller executor.
   * @param {boolean} refreshCache
   * @returns {Promise<void>}
   */
  async _exec(refreshCache = false) {
    try {
      const settings = await this.exec(refreshCache);
      this.worker.port.emit(this.requestId, "SUCCESS", settings);
    } catch (error) {
      console.error(error);
      this.worker.port.emit(this.requestId, 'ERROR', error);
    }
  }

  /**
   * Retrieve the current password expiry settings.
   * @param {boolean} refreshCache
   * @returns {Promise<PasswordExpirySettingsEntity>}
   */
  async exec(refreshCache = false) {
    return await this.passwordExpirySettingsGetOrFindService.exec(refreshCache);
  }
}

export default GetOrFindPasswordExpirySettingsController;
