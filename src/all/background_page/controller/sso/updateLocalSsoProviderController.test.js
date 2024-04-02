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
import "../../../../../test/mocks/mockCryptoKey";
import "../../../../../test/mocks/mockSsoDataStorage";
import {clientSsoKit} from "../../model/entity/sso/ssoKitClientPart.test.data";
import AzureSsoSettingsEntity from "passbolt-styleguide/src/shared/models/entity/ssoSettings/AzureSsoSettingsEntity";
import GoogleSsoSettingsEntity from "passbolt-styleguide/src/shared/models/entity/ssoSettings/GoogleSsoSettingsEntity";
import SsoDataStorage from "../../service/indexedDB_storage/ssoDataStorage";
import UpdateLocalSsoProviderController from "./updateLocalSsoProviderController";
import EntityValidationError from "passbolt-styleguide/src/shared/models/entity/abstract/entityValidationError";

describe("UpdateLocalSsoProviderController", () => {
  describe("UpdateLocalSsoProviderController::exec", () => {
    it("Should update the SSO provider stored locally", async() => {
      expect.assertions(1);
      const expectedProvider = GoogleSsoSettingsEntity.PROVIDER_ID;

      const ssoKit = clientSsoKit({provider: AzureSsoSettingsEntity.PROVIDER_ID});
      SsoDataStorage.setMockedData(ssoKit);

      const controller = new UpdateLocalSsoProviderController();
      await controller.exec(expectedProvider);

      const localKit = await SsoDataStorage.get();
      expect(localKit.provider).toStrictEqual(expectedProvider);
    });

    it("Should throw and exception if the new SSO provider is not valid", async() => {
      expect.assertions(1);
      const expectedProvider = "invalid-provider";

      SsoDataStorage.setMockedData(clientSsoKit());

      const controller = new UpdateLocalSsoProviderController();
      try {
        await controller.exec(expectedProvider);
      } catch (e) {
        expect(e).toStrictEqual(new EntityValidationError("Could not validate property provider."));
      }
    });
  });
});
