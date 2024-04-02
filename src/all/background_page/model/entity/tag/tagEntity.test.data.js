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
 * @since         4.6.0
 */
import {v4 as uuidv4} from "uuid";

export const defaultTagDto = (data = {}) => {
  const id = data?.id || uuidv4();

  return {
    id: id,
    slug: "personal-tag",
    is_shared: false,
    ...data
  };
};

export const sharedTagDto = (data = {}) => sharedTagDto({
  slug: "#shared-tag",
  is_shared: true,
  ...data
});
