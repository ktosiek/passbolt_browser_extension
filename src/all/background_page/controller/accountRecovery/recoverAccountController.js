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
 * @since         3.6.0
 */

const app = require("../../app");
const {AccountRecoveryModel} = require("../../model/accountRecovery/accountRecoveryModel");
const {AccountEntity} = require("../../model/entity/account/accountEntity");
const {AccountModel} = require("../../model/account/accountModel");
const {readMessageOrFail, readKeyOrFail, assertPrivateKey} = require("../../utils/openpgp/openpgpAssertions");
const {AccountLocalStorage} = require("../../service/local_storage/accountLocalStorage");
const {SetupModel} = require("../../model/setup/setupModel");
const {AccountAccountRecoveryEntity} = require("../../model/entity/account/accountAccountRecoveryEntity");
const {AccountRecoverEntity} = require("../../model/entity/account/accountRecoverEntity");
const {DecryptPrivateKeyService} = require("../../service/crypto/decryptPrivateKeyService");
const {DecryptMessageService} = require("../../service/crypto/decryptMessageService");
const {DecryptResponseDataService} = require("../../service/accountRecovery/decryptResponseDataService");
const {EncryptPrivateKeyService} = require("../../service/crypto/encryptPrivateKeyService");

class RecoverAccountController {
  /**
   * Constructor
   * @param {Worker} worker
   * @param {string} requestId uuid
   * @param {ApiClientOptions} apiClientOptions
   * @param {AccountAccountRecoveryEntity} account The account completing the account recovery.
   */
  constructor(worker, requestId, apiClientOptions, account) {
    this.worker = worker;
    this.requestId = requestId;
    this.account = account;
    this.accountRecoveryModel = new AccountRecoveryModel(apiClientOptions);
    this.setupModel = new SetupModel(apiClientOptions);
    this.accountModel = new AccountModel(apiClientOptions);
  }

  /**
   * Wrapper of exec function to run it with worker.
   * @return {Promise<*>}
   */
  async _exec() {
    try {
      await this.exec.apply(this, arguments);
      this.worker.port.emit(this.requestId, "SUCCESS");
    } catch (error) {
      console.error(error);
      this.worker.port.emit(this.requestId, 'ERROR', error);
    }
  }

  /**
   * Check the user temporary account recovery gpg key passphrase.
   *
   * @param {string} passphrase The passphrase to verify
   * @return {Promise<void>}
   */
  async exec(passphrase) {
    if (typeof passphrase === "undefined") {
      throw new Error("A passphrase is required.");
    }
    if (typeof passphrase !== "string") {
      throw new Error("The passphrase should be a string.");
    }

    const request = await this._findAndAssertRequest();
    const recoveredArmoredPrivateKey = await this._recoverPrivateKey(request.accountRecoveryPrivateKey, request.accountRecoveryResponses.items[0], passphrase);
    const accountRecover = await this._completeRecover(recoveredArmoredPrivateKey);
    const account = await this._addRecoveredAccountToStorage(accountRecover);
    this._updateWorkerAccount(account);
    this._initPagemod();
  }

  /**
   * Find the account recovery request.
   * @return {Promise<AccountRecoveryRequestEntity>}
   * @throw {Error} If the request id does not match the request id associated to the account recovery material stored on the extension
   * @throw {Error} If the request does not have a private key defined
   * @throw {Error} If the request does not have a collection of responses defined
   * @throw {Error} If the request responses is empty
   * @private
   */
  async _findAndAssertRequest() {
    const accountRecoveryRequest = await this.accountRecoveryModel.findRequestByIdAndUserIdAndAuthenticationToken(
      this.account.accountRecoveryRequestId,
      this.account.userId,
      this.account.authenticationTokenToken
    );

    if (accountRecoveryRequest.id !== this.account.accountRecoveryRequestId) {
      throw new Error("The account recovery request id should match the request id associated to the account being recovered.");
    }

    if (!accountRecoveryRequest.accountRecoveryPrivateKey) {
      throw new Error("The account recovery request should have a private key.");
    }

    if (!accountRecoveryRequest.accountRecoveryResponses) {
      throw new Error("The account recovery request should have a collection of responses.");
    }

    if (accountRecoveryRequest.accountRecoveryResponses.length !== 1) {
      throw new Error("The account recovery request responses should contain exactly one response.");
    }

    return accountRecoveryRequest;
  }

  /**
   * Recover the user private key.
   * @param {AccountRecoveryPrivateKeyEntity} privateKey The account recovery private key to recover.
   * @param {AccountRecoveryResponseEntity} response The account recovery response.
   * @param {string} passphrase The account recovery request user private key passphrase and recovered private key new passphrase.
   * @return {Promise<openpgp.PrivateKey>} The recovered private armored key.
   * @private
   */
  async _recoverPrivateKey(privateKey, response, passphrase) {
    const key = await readKeyOrFail(this.account.userPrivateArmoredKey);
    const requestPrivateKeyDecrypted = await DecryptPrivateKeyService.decrypt(key, passphrase);
    /*
     * @todo Additional check could be done to ensure the recovered key is the same than the one the user was previously using.
     *   If the user is in the case lost passphrase, a key should still be referenced in the storage of the extension.
     */
    const privateKeyPasswordDecryptedData = await DecryptResponseDataService.decrypt(response, requestPrivateKeyDecrypted, this.account.userId);
    const privateKeyData = await readMessageOrFail(privateKey.data);
    const decryptedRecoveredPrivateArmoredKey = await DecryptMessageService.decryptSymmetrically(privateKeyData, privateKeyPasswordDecryptedData.privateKeySecret);
    const decryptedRecoveredPrivateKey = await readKeyOrFail(decryptedRecoveredPrivateArmoredKey);
    return EncryptPrivateKeyService.encrypt(decryptedRecoveredPrivateKey, passphrase);
  }

  /**
   * Complete the recover.
   * @param {openpgp.PrivateKey} recoveredPrivateKey The recovered private key
   * @return {Promise<AccountRecoverEntity>}
   * @private
   */
  async _completeRecover(recoveredPrivateKey) {
    assertPrivateKey(recoveredPrivateKey);
    const accountRecoverDto = this.account.toDto(AccountAccountRecoveryEntity.ALL_CONTAIN_OPTIONS);
    accountRecoverDto.user_private_armored_key = recoveredPrivateKey.armor();
    accountRecoverDto.user_public_armored_key = recoveredPrivateKey.toPublic().armor();
    const accountRecover = new AccountRecoverEntity(accountRecoverDto);
    await this.setupModel.completeRecover(accountRecover);

    return accountRecover;
  }

  /**
   * Add account to local storage.
   * @param {AccountRecoverEntity} accountRecover The recovered account.
   * @return {Promise<AccountEntity>}
   * @private
   */
  async _addRecoveredAccountToStorage(accountRecover) {
    const account = new AccountEntity(accountRecover.toDto(AccountRecoverEntity.ALL_CONTAIN_OPTIONS));
    await this.accountModel.add(account);
    // Remove from the local storage the account recovery used to initiate/complete the account recovery.
    await AccountLocalStorage.deleteByUserIdAndType(account.userId, AccountAccountRecoveryEntity.TYPE_ACCOUNT_ACCOUNT_RECOVERY);

    return account;
  }

  /**
   * Update the worker account with the recovered credentials.
   * @todo This step is necessary to perform a sign-in with the current account/signInController, where it requires the
   *   account associated with the worker to be associated with the user keys. As there is no solution to change the
   *   current worker account, the keys need to be associated to the account recovery account temporarily.
   *
   * @param {AccountEntity} account The recovered account
   * @return {void}
   * @private
   */
  _updateWorkerAccount(account) {
    this.account.userPublicArmoredKey = account.userPublicArmoredKey;
    this.account.userPrivateArmoredKey = account.userPrivateArmoredKey;
  }

  /**
   * Initialize pagemods. If the extension was never configured, the web integration and authentication pagemods were
   * disabled.
   *
   * @return {void}
   * @private
   */
  _initPagemod() {
    // If there was no account yet configured, the following pagemods were not instantiated a the extension bootstrap.
    if (!app.pageMods.WebIntegration._pageMod) {
      app.pageMods.WebIntegration.init();
    }
    if (!app.pageMods.AuthBootstrap._pageMod) {
      app.pageMods.AuthBootstrap.init();
    }
  }
}

exports.RecoverAccountController = RecoverAccountController;