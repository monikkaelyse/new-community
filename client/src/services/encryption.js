/**
 * E2E Encryption Service using TweetNaCl + Web Crypto API.
 *
 * - Keypair generation (NaCl box)
 * - Message encrypt/decrypt (NaCl box — public key authenticated)
 * - Secret key encrypt/decrypt (NaCl secretbox — symmetric)
 * - Password-based key derivation (PBKDF2 via Web Crypto)
 *
 * Private keys NEVER leave the client in plaintext.
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// ─────────────────────────────────────────────
// Keypair Generation
// ─────────────────────────────────────────────

/**
 * Generate a new NaCl box keypair for E2E encryption.
 * @returns {{ publicKey: string, secretKey: string }} Base64-encoded keys
 */
export function generateKeypair() {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keypair.publicKey),
    secretKey: encodeBase64(keypair.secretKey),
  };
}

// ─────────────────────────────────────────────
// Password-Based Key Derivation (PBKDF2)
// ─────────────────────────────────────────────

/**
 * Derive a 32-byte encryption key from a password + salt using PBKDF2.
 * Uses Web Crypto API — runs in the browser, never on the server.
 * @param {string} password - User's plaintext password
 * @param {Uint8Array} salt - Random salt (32 bytes)
 * @returns {Promise<Uint8Array>} 32-byte derived key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 600000, // OWASP recommended minimum for PBKDF2-SHA256
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 32 bytes
  );

  return new Uint8Array(derivedBits);
}

/**
 * Generate a random salt for PBKDF2.
 * @returns {string} Base64-encoded 32-byte salt
 */
export function generateSalt() {
  return encodeBase64(nacl.randomBytes(32));
}

// ─────────────────────────────────────────────
// Secret Key Encryption (for storage)
// ─────────────────────────────────────────────

/**
 * Encrypt a user's secret key with their password for safe server storage.
 * The server only ever sees the ciphertext — never the plaintext key.
 *
 * @param {string} secretKey - Base64-encoded NaCl secret key
 * @param {string} password - User's plaintext password
 * @returns {Promise<{ encryptedSecretKey: string, nonce: string, salt: string }>}
 */
export async function encryptSecretKeyWithPassword(secretKey, password) {
  const salt = nacl.randomBytes(32);
  const derivedKey = await deriveKey(password, salt);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

  const encrypted = nacl.secretbox(
    decodeBase64(secretKey),
    nonce,
    derivedKey
  );

  return {
    encryptedSecretKey: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    salt: encodeBase64(salt),
  };
}

/**
 * Decrypt a user's secret key using their password.
 * Called on login to recover the plaintext secret key in the browser.
 *
 * @param {string} encryptedSecretKey - Base64-encoded ciphertext
 * @param {string} nonce - Base64-encoded nonce
 * @param {string} salt - Base64-encoded salt
 * @param {string} password - User's plaintext password
 * @returns {Promise<string|null>} Base64-encoded plaintext secret key, or null if wrong password
 */
export async function decryptSecretKeyWithPassword(encryptedSecretKey, nonce, salt, password) {
  const derivedKey = await deriveKey(password, decodeBase64(salt));

  const decrypted = nacl.secretbox.open(
    decodeBase64(encryptedSecretKey),
    decodeBase64(nonce),
    derivedKey
  );

  if (!decrypted) return null;
  return encodeBase64(decrypted);
}

// ─────────────────────────────────────────────
// Message Encryption (E2E — NaCl box)
// ─────────────────────────────────────────────

/**
 * Encrypt a message for a specific recipient.
 * @param {string} message - Plaintext message
 * @param {string} recipientPublicKey - Base64-encoded recipient public key
 * @param {string} senderSecretKey - Base64-encoded sender secret key
 * @returns {{ encryptedContent: string, nonce: string }}
 */
export function encryptMessage(message, recipientPublicKey, senderSecretKey) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = new TextEncoder().encode(message);
  const encrypted = nacl.box(
    messageBytes,
    nonce,
    decodeBase64(recipientPublicKey),
    decodeBase64(senderSecretKey),
  );

  return {
    encryptedContent: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Decrypt a message from a specific sender.
 * @param {string} encryptedContent - Base64-encoded ciphertext
 * @param {string} nonce - Base64-encoded nonce
 * @param {string} senderPublicKey - Base64-encoded sender public key
 * @param {string} recipientSecretKey - Base64-encoded recipient secret key
 * @returns {string|null} Decrypted plaintext or null if decryption fails
 */
export function decryptMessage(encryptedContent, nonce, senderPublicKey, recipientSecretKey) {
  const decrypted = nacl.box.open(
    decodeBase64(encryptedContent),
    decodeBase64(nonce),
    decodeBase64(senderPublicKey),
    decodeBase64(recipientSecretKey),
  );

  if (!decrypted) return null;
  return new TextDecoder().decode(decrypted);
}
