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

import {enableFetchMocks} from "jest-fetch-mock";
import AccountEntity from "../../model/entity/account/accountEntity";
import BuildApiClientOptionsService from "../../service/account/buildApiClientOptionsService";
import {defaultAccountDto} from "../../model/entity/account/accountEntity.test.data";
import {mockApiResponse, mockApiResponseError} from "../../../../../test/mocks/mockApiResponse";
import DeletePasswordExpirySettingsController from "./deletePasswordExpirySettingsController";
import {v4 as uuid} from "uuid";
import PassboltApiFetchError from "passbolt-styleguide/src/shared/lib/Error/PassboltApiFetchError";

describe("DeletePasswordExpirySettingsController", () => {
  let account, apiClientOptions;
  beforeEach(async() => {
    enableFetchMocks();
    fetch.resetMocks();
    jest.spyOn(browser.cookies, "get").mockImplementationOnce(() => ({value: "csrf-token"}));

    account = new AccountEntity(defaultAccountDto());
    apiClientOptions = await BuildApiClientOptionsService.buildFromAccount(account);
  });

  it("Should delete the entity from the API given an ID", () => {
    expect.assertions(1);
    const passwordExpiryId = uuid();
    fetch.doMockOnceIf(new RegExp(`/password-expiry\/settings\/${passwordExpiryId}\.json`), () => mockApiResponse({}));

    const controller = new DeletePasswordExpirySettingsController(null, null, account, apiClientOptions);
    expect(() => controller.exec(passwordExpiryId)).not.toThrow();
  });

  it("Should throw an exception if something wrong happens on the API", async() => {
    expect.assertions(1);

    const passwordExpiryId = uuid();
    const errorMessage = "Unable to reach the server, an unexpected error occurred";
    const expectedError = new PassboltApiFetchError(errorMessage);
    fetch.doMockOnceIf(new RegExp(`/password-expiry\/settings\/${passwordExpiryId}\.json`), () => mockApiResponseError(500, errorMessage));

    const controller = new DeletePasswordExpirySettingsController(null, null, account, apiClientOptions);
    await expect(() => controller.exec(passwordExpiryId)).rejects.toThrowError(expectedError);
  });

  it("Should return the default value if something goes when requesting the API", async() => {
    expect.assertions(1);

    const passwordExpiryId = uuid();
    const expectedError = new Error("Unable to reach the server, an unexpected error occurred");
    fetch.doMockOnceIf(new RegExp(`/password-expiry\/settings\/${passwordExpiryId}\.json`), async() => { throw expectedError; });

    const controller = new DeletePasswordExpirySettingsController(null, null, account, apiClientOptions);
    await expect(() => controller.exec(passwordExpiryId)).rejects.toThrowError(expectedError);
  });
});
