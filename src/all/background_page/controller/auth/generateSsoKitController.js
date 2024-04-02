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

import SsoKitServerPartModel from "../../model/sso/ssoKitServerPartModel";
import GenerateSsoKitService from "../../service/sso/generateSsoKitService";
import SsoDataStorage from "../../service/indexedDB_storage/ssoDataStorage";
import GetPassphraseService from "../../service/passphrase/getPassphraseService";

class GenerateSsoKitController {
  /**
   * GenerateSsoKitController constructor
   * @param {Worker} worker
   * @param {string} requestId uuid
   * @param {ApiClientOptions} apiClientOptions the api client options
   * @param {AccountEntity} account the account associated to the worker
   */
  constructor(worker, requestId, apiClientOptions, account) {
    this.worker = worker;
    this.requestId = requestId;
    this.ssoKitServerPartModel = new SsoKitServerPartModel(apiClientOptions);
    this.getPassphraseService = new GetPassphraseService(account);
  }

  /**
   * Wrapper of exec function to run it with worker.
   *
   * @param {string} provider the provider id
   * @return {Promise<void>}
   */
  async _exec(provider) {
    try {
      await this.exec(provider);
      this.worker.port.emit(this.requestId, 'SUCCESS');
    } catch (error) {
      console.error(error);
      this.worker.port.emit(this.requestId, 'ERROR', error);
    }
  }

  /**
   * Generates an SSO kit for the current logged in user.
   *
   * @param {string} provider the SSO provider id
   * @return {Promise<void>}
   */
  async exec(provider) {
    const currentKit = await SsoDataStorage.get();

    // A kit already exists
    if (currentKit) {
      // if the provider change, the kit is still usable, just the provider id needs to be changed
      if (currentKit?.provider !== provider) {
        currentKit.provider = provider;
        await SsoDataStorage.updateLocalKitProviderWith(currentKit);
      }
      return;
    }

    // No SSO kit is avaible, we need to generate a new one.
    const passphrase = await this.getPassphraseService.getPassphrase(this.worker);
    const ssoKits = await GenerateSsoKitService.generateSsoKits(passphrase, provider);

    const registeredServerPartSsoKit = await this.ssoKitServerPartModel.setupSsoKit(ssoKits.serverPart);
    ssoKits.clientPart.id = registeredServerPartSsoKit.id;
    await SsoDataStorage.save(ssoKits.clientPart);
  }
}

export default GenerateSsoKitController;
