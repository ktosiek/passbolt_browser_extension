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

import {readKeyOrFail} from "../../src/all/background_page/utils/openpgp/openpgpAssertions";

exports.toBeOpenpgpPublicKey = async function(armoredKey) {
  const {matcherHint} = this.utils;

  const passMessage =
    `${matcherHint('.not.toBeOpenpgpPublicKey')
    }\n\n` +
    `Expected key not to be public`;

  const failMessage =
    `${matcherHint('.toBeOpenpgpPublicKey')
    }\n\n` +
    `Expected key to be public`;

  const key = await readKeyOrFail(armoredKey);
  const pass = !key.isPrivate();

  return {pass: pass, message: () => (pass ? passMessage : failMessage)};
};