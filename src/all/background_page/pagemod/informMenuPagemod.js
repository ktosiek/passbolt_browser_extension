/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) 2023 Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) 2023 Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         4.0.0
 */
import Pagemod from "./pagemod";
import {InformMenuEvents} from "../event/informMenuEvents";
import GetLegacyAccountService from "../service/account/getLegacyAccountService";
import BuildApiClientOptionsService from "../service/account/buildApiClientOptionsService";

class InFormMenu extends Pagemod {
  /**
   * @inheritDoc
   * @returns {string}
   */
  get appName() {
    return "InFormMenu";
  }

  /**
   * @inheritDoc
   */
  get events() {
    return [InformMenuEvents];
  }

  /**
   * @inheritDoc
   */
  async attachEvents(port) {
    try {
      const tab = port._port.sender.tab;
      const account = await GetLegacyAccountService.get();
      const apiClientOptions = await BuildApiClientOptionsService.buildFromAccount(account);
      const name = this.appName;
      for (const event of this.events) {
        event.listen({port, tab, name}, apiClientOptions, account);
      }
    } catch (error) {
      /*
       * Ensure the application does not crash completely if the legacy account cannot be retrieved.
       * The following controllers won't work as expected:
       * - RequestHelpCredentialsLostController
       */
      console.error('InFormMenu::attach legacy account cannot be retrieved, please contact your administrator.');
      console.error(error);
    }
  }
}

export default new InFormMenu();
