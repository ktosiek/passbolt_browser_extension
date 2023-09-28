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

import Entity from "passbolt-styleguide/src/shared/models/entity/abstract/entity";
import EntitySchema from "passbolt-styleguide/src/shared/models/entity/abstract/entitySchema";


const ENTITY_NAME = 'MfaSetupTotp';

class MfaSetupTotpEntity extends Entity {
  /**
   * Mfa policy entity constructor
   *
   * @param {Object} setupDto totp setup dto
   * @throws {EntityValidationError} if the dto cannot be converted into an entity
   */
  constructor(setupDto) {
    super(EntitySchema.validate(
      MfaSetupTotpEntity.ENTITY_NAME,
      setupDto,
      MfaSetupTotpEntity.getSchema()
    ));
  }

  /**
   * Get mfa policy entity schema
   * @returns {Object} schema
   */
  static getSchema() {
    return {
      "type": "object",
      "required": [
        "otpProvisioningUri",
        "totp"
      ],
      "properties": {
        "totp": {
          "type": "string",
          "pattern": /^[a-z0-9]{6}$/
        },
        "otpProvisioningUri": {
          "type": "string",
        }
      }
    };
  }

  /*
   * ==================================================
   * Static properties getters
   * ==================================================
   */
  /**
   * MfaPolicyEntity.ENTITY_NAME
   * @returns {string}
   */
  static get ENTITY_NAME() {
    return ENTITY_NAME;
  }
}

export default MfaSetupTotpEntity;
