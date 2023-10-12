// import { Password } from "../User/model";
import { passwordConfig } from "../config"
import * as crypto from "crypto";

/**
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 * @param password 
 * @param salt 
 * @returns 
 */
export async function generatePassword(password: string, salt?: string) {
    const generatedSalt: string = salt ?? crypto.randomBytes(passwordConfig.saltBytes).toString('hex');
    const hash: string = await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, generatedSalt, passwordConfig.iterations, passwordConfig.keyLength, passwordConfig.digest, (err, derivedKey) => {
            if(err) {
                reject(err);
            }
            else {
                resolve(derivedKey.toString('hex'));
            }
        })
    });
    return {
        hash: hash,
        salt: generatedSalt
    }
//     const passwordObj = new Password();
//     passwordObj.hash = hash;
//     passwordObj.salt = generatedSalt;
//     return passwordObj;
}