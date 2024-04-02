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
 * @since         2.13.0
 */
import Entity from "passbolt-styleguide/src/shared/models/entity/abstract/entity";
import ThemeEntity from "../themeEntity";
import EntitySchema from "passbolt-styleguide/src/shared/models/entity/abstract/entitySchema";

const ENTITY_NAME = 'ChangeTheme';

class ChangeThemeEntity extends Entity {
  /**
   * @inheritDoc
   */
  constructor(changeThemeDto, options = {}) {
    super(EntitySchema.validate(
      ChangeThemeEntity.ENTITY_NAME,
      changeThemeDto,
      ChangeThemeEntity.getSchema()
    ), options);
  }

  /**
   * Get secret entity schema
   * @returns {Object} schema
   */
  static getSchema() {
    const themeEntitySchema = ThemeEntity.getSchema();
    return {
      "type": "object",
      "required": [
        "name",
      ],
      "properties": {
        "name": themeEntitySchema.properties.name
      }
    };
  }

  /*
   * ==================================================
   * Dynamic properties getters
   * ==================================================
   */

  /**
   * Get theme name
   * @returns {string} admin or user
   */
  get name() {
    return this._props.name;
  }


  /*
   * ==================================================
   * Static properties getters
   * ==================================================
   */
  /**
   * ThemeEntity.ENTITY_NAME
   * @returns {string}
   */
  static get ENTITY_NAME() {
    return ENTITY_NAME;
  }
}

export default ChangeThemeEntity;
