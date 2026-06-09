import * as crypto from 'crypto';

export class CryptoUtil {
  /**
   * Encrypts a plain text string using a specified secret key and algorithm.
   *
   * @param plainText - The plain text to encrypt.
   * @param secretKey - The secret key used for encryption. Must be 16, 24, or 32 characters long for 128, 192, or 256 bits of key size.
   * @param algorithm - The encryption algorithm to use (optional). Defaults to 'aes-128-gcm'.
   * @returns The encrypted string in base64 encoding.
   */
  public static encryptString(
    plainText: string,
    secretKey: string,
    algorithm?: crypto.CipherGCMTypes,
  ) {
    if (!algorithm) algorithm = 'aes-128-gcm';

    // Use the first 16 characters of the secret key as the initialization vector (IV)
    const iv = secretKey.substring(0, 16);

    // Create a cipher instance using the specified algorithm, secret key, and IV
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv, { authTagLength: 16 });

    // Encrypt the plain text and concatenate the authentication tag
    const encrypted = Buffer.concat([
      cipher.update(plainText),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    // Return the encrypted data as a base64-encoded string
    return encrypted.toString('base64');
  }

  /**
   * Decrypts an encrypted string using a specified secret key and algorithm.
   *
   * @param encryptedText - The encrypted string in base64 encoding.
   * @param secretKey - The secret key used for decryption.
   * @param algorithm - The decryption algorithm to use (optional). Defaults to 'aes-128-gcm'.
   * @returns The decrypted plain text string.
   */
  public static decryptString(
    encryptedText: string,
    secretKey: string,
    algorithm?: crypto.CipherGCMTypes,
  ) {
    if (!algorithm) algorithm = 'aes-128-gcm';

    // Use the first 16 characters of the secret key as the initialization vector (IV)
    const iv = secretKey.substring(0, 16);

    // Create a decipher instance using the specified algorithm, secret key, and IV
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv, { authTagLength: 16 });

    // Decode the base64-encoded encrypted text into a buffer
    const encRawTextBuff = Buffer.from(encryptedText, 'base64');

    // Extract the authentication tag from the end of the buffer
    const authTagBuff = encRawTextBuff.subarray(encRawTextBuff.length - 16);

    // Extract the encrypted text from the buffer
    const encryptedTextBuff = encRawTextBuff.subarray(0, encRawTextBuff.length - 16);

    // Set the authentication tag for the decipher instance
    decipher.setAuthTag(authTagBuff);

    // Decrypt the encrypted text
    const decrypted = Buffer.concat([decipher.update(encryptedTextBuff), decipher.final()]);

    // Return the decrypted data as a string
    return decrypted.toString();
  }

  /**
   * Generates a hash of a plain text string using a specified key and algorithm.
   *
   * @param plainStr - The plain text string to hash.
   * @param key - The key used for hashing.
   * @param algorithm - The hashing algorithm to use (optional). Defaults to 'sha256'.
   * @returns The hashed string in hexadecimal encoding.
   */
  public static hashString(plainStr: string, key: string, algorithm?: string): string {
    if (!algorithm) algorithm = 'sha256';

    // Create a HMAC hash instance using the specified algorithm and key
    const hash = crypto.createHmac(algorithm, key);

    // Update the hash with the plain text string
    hash.update(plainStr);

    // Return the hashed data as a hexadecimal-encoded string
    return hash.digest('hex');
  }

  /**
   * Generates an MD5 hash of the given data.
   *
   * @param data The input data to hash.  This can be a string, Buffer, TypedArray, or DataView.
   * @param encoding Optional encoding for the output hash. Defaults to 'base64'.
   *                 Other possible values include 'hex', 'latin1', etc. See Node.js
   *                 crypto documentation for a complete list.
   * @returns The MD5 hash of the data, encoded according to the specified encoding.
   *          Returns a string if encoding is provided, a Buffer otherwise.
   */
  public static generateMD5(data: crypto.BinaryLike, encoding?: crypto.BinaryToTextEncoding) {
    // Set the default encoding to 'base64' if no encoding is provided.
    if (!encoding) encoding = 'base64';

    // Create an MD5 hash object.
    const hash = crypto.createHash('md5');

    // Update the hash object with the input data.
    hash.update(data);

    // Calculate and return the MD5 hash.
    return hash.digest(encoding);
  }
}
