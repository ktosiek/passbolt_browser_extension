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
 */
import EntityValidationError from "passbolt-styleguide/src/shared/models/entity/abstract/entityValidationError";
import EntitySchema from "passbolt-styleguide/src/shared/models/entity/abstract/entitySchema";
import ExternalResourceEntity from "./externalResourceEntity";
import ExternalFolderEntity from "../../folder/external/externalFolderEntity";
import {v4 as uuidv4} from "uuid";
import {defaultTotpDto} from "../../totp/totpDto.test.data";

describe("ExternalResourceEntity", () => {
  it("schema must validate", () => {
    EntitySchema.validateSchema(ExternalResourceEntity.ENTITY_NAME, ExternalResourceEntity.getSchema());
  });

  it("constructor works if valid minimal DTO is provided", () => {
    const dto = {
      "name": "Password 1",
      "secret_clear": ""
    };
    const result = {
      "name": "Password 1",
      "secret_clear": "",
      "folder_parent_path": "",
    };
    const entity = new ExternalResourceEntity(dto);
    expect(entity.toDto()).toEqual(result);
    expect(entity.id).toEqual(null);
    expect(entity.name).toEqual("Password 1");
    expect(entity.username).toBeUndefined();
    expect(entity.uri).toBeUndefined();
    expect(entity.description).toBeUndefined();
    expect(entity.secretClear).toEqual("");
    expect(entity.folderParentId).toEqual(null);
    expect(entity.folderParentPath).toEqual("");
    expect(entity.secrets).toBeUndefined();
  });

  it("constructor works if valid fields DTO is provided", () => {
    expect.assertions(12);
    const id = uuidv4();
    const totp = defaultTotpDto();
    const dto = {
      "id": id,
      "name": "Password 1",
      "secret_clear": "password",
      "username": "username",
      "uri": "uri",
      "description": "description",
      "totp": totp
    };
    const result = {
      "id": id,
      "name": "Password 1",
      "secret_clear": "password",
      "username": "username",
      "uri": "uri",
      "description": "description",
      "totp": totp,
      "folder_parent_path": "",
    };
    const entity = new ExternalResourceEntity(dto);
    expect(entity.toDto()).toEqual(result);
    expect(entity.id).toEqual(result.id);
    expect(entity.name).toEqual(result.name);
    expect(entity.username).toEqual(result.username);
    expect(entity.uri).toEqual(result.uri);
    expect(entity.description).toEqual(result.description);
    expect(entity.secretClear).toEqual(result.secret_clear);
    expect(entity.folderParentId).toEqual(null);
    expect(entity.folderParentPath).toEqual("");
    expect(entity.totp).toEqual(result.totp);
    expect(entity.secrets).toBeUndefined();
    entity.totp = defaultTotpDto({secret_key: "OFL3VF3OU4BZP45D4ZME6KTF654JRSSO4Q2EO6FJFGPKHRHYSVJA"});
    expect(entity.totp.secret_key !== result.totp.secret_key).toBeTruthy();
  });

  it("constructor build resource with default values", () => {
    const entity = new ExternalResourceEntity({});
    expect(entity.name).toEqual(ExternalResourceEntity.DEFAULT_RESOURCE_NAME);
    expect(entity.folderParentPath).toEqual("");
  });

  it("constructor sanitize folder_parent_path", () => {
    const dto = {
      "name": "Password 1",
      "secret_clear": "",
      "folder_parent_path": "// at/ the///root /"
    };
    const entity = new ExternalResourceEntity(dto);
    expect(entity.folderParentPath).toEqual("/ at/ the/root /");
  });

  it("constructor returns validation error if dto fields are invalid", () => {
    try {
      new ExternalResourceEntity({
        "name": true,
        "secret_clear": {},
        "folder_parent_path": []
      });
      expect(true).toBeFalsy();
    } catch (error) {
      expect(error).toBeInstanceOf(EntityValidationError);
      expect(error.hasError("name")).toBe(true);
      expect(error.hasError("secret_clear")).toBe(true);
      expect(error.hasError("folder_parent_path")).toBe(true);
    }
  });

  it("changeRootPath change the resource root path", () => {
    const rootFolder = new ExternalFolderEntity({"name": "root"});
    const resource = new ExternalResourceEntity({"name": "Resource 1", "secret_clear": ""});
    resource.changeRootPath(rootFolder);
    expect(resource.folderParentPath).toEqual("root");
    resource.changeRootPath(rootFolder);
    expect(resource.folderParentPath).toEqual("root/root");
  });
});
