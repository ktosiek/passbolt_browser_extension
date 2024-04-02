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
 * @since         4.3.0
 */

import DesktopTransferModel from "../../model/desktopTransfer/desktopTransferModel";
import FileService from "../../service/file/fileService";
import GetPassphraseService from "../../service/passphrase/getPassphraseService";
import {Buffer} from 'buffer';
import DecryptPrivateKeyService from "../../service/crypto/decryptPrivateKeyService";
import SignMessageService from "../../service/crypto/signMessageService";
import {OpenpgpAssertion} from "../../utils/openpgp/openpgpAssertions";

const PUBLIC_FILENAME = "account-kit.passbolt";
const MIME_TYPE_TEXT_PLAIN = "application/passbolt";

class ExportDesktopAccountController {
  /**
   * ExportAccountController constructor
   * @param {Worker} worker
   * @param {string} requestId uuid
   * @param {AccountEntity}  account
   */
  constructor(worker, requestId, account) {
    this.worker = worker;
    this.requestId = requestId;
    this.desktopTransferModel = new DesktopTransferModel();
    this.account = account;
    this.getPassphraseService = new GetPassphraseService(account);
  }

  /**
   * Controller executor.
   * @returns {Promise<void>}
   */
  async _exec() {
    try {
      await this.exec.apply(this, arguments);
      this.worker.port.emit(this.requestId, 'SUCCESS');
    } catch (error) {
      console.error(error);
      this.worker.port.emit(this.requestId, 'ERROR', error);
    }
  }

  /**
   * Export account for desktop application
   *
   * @return {Promise<string>}
   */
  async exec() {
    const passphrase = await this.getPassphraseService.getPassphrase(this.worker);
    const accountKit = await this.desktopTransferModel.getAccountKit(this.account);
    const accountKitDto = accountKit.toDto();

    const accountKitMessage = await OpenpgpAssertion.createCleartextMessageOrFail(JSON.stringify(accountKitDto));
    const privateKeyForSigning = await OpenpgpAssertion.readKeyOrFail(accountKitDto["user_private_armored_key"]);
    const decryptedPrivateKey = await DecryptPrivateKeyService.decrypt(privateKeyForSigning, passphrase);
    const signedAccountKit = await SignMessageService.signClearMessage(accountKitMessage, [decryptedPrivateKey]);
    const fileContent = Buffer.from(signedAccountKit).toString('base64');
    await FileService.saveFile(PUBLIC_FILENAME, fileContent, MIME_TYPE_TEXT_PLAIN, this.worker.tab.id);
  }
}

export default ExportDesktopAccountController;

