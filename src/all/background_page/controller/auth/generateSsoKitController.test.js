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
 * @since         3.10.0
 */
import {enableFetchMocks} from "jest-fetch-mock";
import {v4 as uuid} from "uuid";
import "../../../../../test/mocks/mockSsoDataStorage";
import "../../../../../test/mocks/mockCryptoKey";
import {mockApiResponse} from "../../../../../test/mocks/mockApiResponse";
import {pgpKeys} from "../../../../../test/fixtures/pgpKeys/keys";
import {defaultApiClientOptions} from "passbolt-styleguide/src/shared/lib/apiClient/apiClientOptions.test.data";
import GenerateSsoKitService from "../../service/sso/generateSsoKitService";
import SsoDataStorage from "../../service/indexedDB_storage/ssoDataStorage";
import {clientSsoKit} from "../../model/entity/sso/ssoKitClientPart.test.data";
import SsoKitClientPartEntity from "../../model/entity/sso/ssoKitClientPartEntity";
import SsoKitServerPartEntity from "../../model/entity/sso/ssoKitServerPartEntity";
import GenerateSsoKitController from "./generateSsoKitController";
import {generateSsoKitServerData} from "../../model/entity/sso/ssoKitServerPart.test.data";
import AzureSsoSettingsEntity from "passbolt-styleguide/src/shared/models/entity/ssoSettings/AzureSsoSettingsEntity";
import GoogleSsoSettingsEntity from "passbolt-styleguide/src/shared/models/entity/ssoSettings/GoogleSsoSettingsEntity";

jest.mock("../../service/passphrase/getPassphraseService");

beforeEach(() => {
  enableFetchMocks();
  jest.clearAllMocks();
});

describe("GenerateSsoKitController", () => {
  describe("GenerateSsoKitController::exec", () => {
    it("Should generate a brand new kit if none exists.", async() => {
      expect.assertions(6);
      const data = generateSsoKitServerData({});
      const expectedProvider = AzureSsoSettingsEntity.PROVIDER_ID;
      const expextedKitId = uuid();
      const expectedServerPartKit = new SsoKitServerPartEntity({data});
      const expectedClientPartKit = new SsoKitClientPartEntity(clientSsoKit());
      const exepctedClientPartKitWithId = new SsoKitClientPartEntity({...(expectedClientPartKit.toDbSerializableObject()), id: expextedKitId,});

      SsoDataStorage.setMockedData(null);

      jest.spyOn(GenerateSsoKitService, "generateSsoKits").mockImplementation((passprhase, provider) => {
        expect(passprhase).toBe(pgpKeys.ada.passphrase);
        expect(provider).toBe(expectedProvider);

        return {
          clientPart: expectedClientPartKit,
          serverPart: expectedServerPartKit,
        };
      });

      fetch.doMockOnce(async req => {
        const serverPartKeyDto = JSON.parse(await req.text());
        const expectedServerPartKeyDto = expectedServerPartKit.toDto();
        expect(serverPartKeyDto).toStrictEqual(expectedServerPartKeyDto);

        return mockApiResponse({
          ...expectedServerPartKeyDto,
          id: expextedKitId
        });
      });

      const controller = new GenerateSsoKitController(null, null, defaultApiClientOptions());
      controller.getPassphraseService.getPassphrase.mockResolvedValue(pgpKeys.ada.passphrase);

      await controller.exec(expectedProvider);

      expect(controller.getPassphraseService.getPassphrase).toHaveBeenCalledTimes(1);
      expect(SsoDataStorage.save).toHaveBeenCalledTimes(1);
      expect(SsoDataStorage.save).toHaveBeenCalledWith(exepctedClientPartKitWithId);
    });

    it("Should update the provider if a kit exists and the provider changed.", async() => {
      expect.assertions(2);
      const expectedProvider = GoogleSsoSettingsEntity.PROVIDER_ID;
      const clientSsoKitDto = clientSsoKit({provider: AzureSsoSettingsEntity.PROVIDER_ID});
      const storedSsoKit = new SsoKitClientPartEntity(clientSsoKitDto);

      SsoDataStorage.setMockedData(storedSsoKit.toDbSerializableObject());

      const controller = new GenerateSsoKitController(null, null, defaultApiClientOptions());
      controller.getPassphraseService.getPassphrase.mockResolvedValue(pgpKeys.ada.passphrase);

      const expectedSsoKit = new SsoKitClientPartEntity({...clientSsoKitDto, provider: expectedProvider});
      await controller.exec(expectedProvider);

      expect(SsoDataStorage.updateLocalKitProviderWith).toHaveBeenCalledTimes(1);
      expect(SsoDataStorage.updateLocalKitProviderWith).toHaveBeenCalledWith(expectedSsoKit);
    });
  });
});
