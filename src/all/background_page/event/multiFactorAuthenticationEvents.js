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
 */
import MultiFactorAuthenticationModel from "../model/multiFactorAuthentication/multiFactorAuthenticationModel";

/**
 * Listens to the Multi-Factor-Authentication events
 * @param {Worker} worker The worker
 * @param {ApiClientOptions} apiClientOptions The api client options
 */
const listen = function(worker, apiClientOptions) {
  /*
   * Disable mfa for a user
   *
   * @listens passbolt.mfa.disable-for-user
   * @param {string} requestId The request identifier uuid
   * @param {string} userId The user uuid
   */
  worker.port.on('passbolt.mfa.disable-for-user', async(requestId, userId) => {
    try {
      const mfaModel = new MultiFactorAuthenticationModel(apiClientOptions);
      await mfaModel.disableForUser(userId);
      worker.port.emit(requestId, 'SUCCESS');
    } catch (error) {
      console.error(error);
      worker.port.emit(requestId, 'ERROR', error);
    }
  });
};

export const MultiFactorAuthenticationEvents = {listen};
