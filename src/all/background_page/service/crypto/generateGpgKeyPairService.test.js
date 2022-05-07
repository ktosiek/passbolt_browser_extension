/**
 * Passbolt ~ Open source password manager for teams
 * Copyright (c) 2021 Passbolt SA (https://www.passbolt.com)
 *
 * Licensed under GNU Affero General Public License version 3 of the or any later version.
 * For full copyright and license information, please see the LICENSE.txt
 * Redistributions of files must retain the above copyright notice.
 *
 * @copyright     Copyright (c) 2021 Passbolt SA (https://www.passbolt.com)
 * @license       https://opensource.org/licenses/AGPL-3.0 AGPL License
 * @link          https://www.passbolt.com Passbolt(tm)
 * @since         3.6.0
 */
import {GenerateGpgKeyPairService} from "./generateGpgKeyPairService";
import {GetGpgKeyInfoService} from "./getGpgKeyInfoService";
import {GenerateGpgKeyPairOptionsEntity} from "../../model/entity/gpgkey/generate/generateGpgKeyPairOptionsEntity";
import {DecryptPrivateKeyService} from "../../service/crypto/decryptPrivateKeyService";

describe("GenerateGpgKeyPair service", () => {
  it('should generate a key pair according to the given parameters', async() => {
    expect.assertions(16);
    const generateGpgKeyPairOptionsDto =  {
      name: "Jean-Jacky",
      email: "jj@passbolt.com",
      passphrase: "ultra-secure",
      keySize: 4096
    };

    const generateGpgKeyPairOptionsEntity = new GenerateGpgKeyPairOptionsEntity(generateGpgKeyPairOptionsDto);
    const keyPair = await GenerateGpgKeyPairService.generateKeyPair(generateGpgKeyPairOptionsEntity);
    expect(keyPair).not.toBeNull();
    expect(keyPair.public_key).not.toBeNull();
    expect(keyPair.private_key).not.toBeNull();

    const publicKeyInfo = await GetGpgKeyInfoService.getKeyInfo(keyPair.publicKey.armoredKey);
    expect(publicKeyInfo.algorithm).toBe("RSA");
    expect(publicKeyInfo.userIds[0]).toEqual({name: generateGpgKeyPairOptionsDto.name, email: generateGpgKeyPairOptionsDto.email});
    expect(publicKeyInfo.length).toBe(generateGpgKeyPairOptionsDto.keySize);
    expect(publicKeyInfo.private).toBe(false);
    expect(publicKeyInfo.revoked).toBe(false);
    expect(publicKeyInfo.expires).toBe("Never");

    const privateKeyInfo = await GetGpgKeyInfoService.getKeyInfo(keyPair.privateKey.armoredKey);
    expect(privateKeyInfo.algorithm).toBe("RSA");
    expect(privateKeyInfo.userIds[0]).toEqual({name: generateGpgKeyPairOptionsDto.name, email: generateGpgKeyPairOptionsDto.email});
    expect(privateKeyInfo.length).toBe(generateGpgKeyPairOptionsDto.keySize);
    expect(privateKeyInfo.private).toBe(true);
    expect(privateKeyInfo.revoked).toBe(false);
    expect(privateKeyInfo.expires).toBe("Never");

    const decryptedPrivateKey = await DecryptPrivateKeyService.decrypt(keyPair.privateKey.armoredKey, generateGpgKeyPairOptionsDto.passphrase);
    expect(decryptedPrivateKey).not.toBeNull();
  }, 50 * 1000);
});
