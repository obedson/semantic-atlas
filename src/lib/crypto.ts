export type EncryptedPayloadEnvelope = {
  algorithm: "AES-GCM";
  kdf: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

const ENCRYPTION_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

function getCrypto() {
  const cryptoImpl = globalThis.crypto;
  if (!cryptoImpl?.subtle) {
    throw new Error("Web Crypto is not available in this runtime.");
  }
  return cryptoImpl;
}

function bytesToBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array) {
  if (!passphrase.trim()) {
    throw new Error("A passphrase is required for encrypted payloads.");
  }

  const cryptoImpl = getCrypto();
  const encoder = new TextEncoder();
  const material = await cryptoImpl.subtle.importKey(
    "raw",
    toArrayBuffer(encoder.encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return cryptoImpl.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations: ENCRYPTION_ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(
  plaintext: string,
  passphrase: string,
): Promise<EncryptedPayloadEnvelope> {
  const cryptoImpl = getCrypto();
  const salt = cryptoImpl.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = cryptoImpl.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveAesKey(passphrase, salt);
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await cryptoImpl.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoded),
  );

  return {
    algorithm: "AES-GCM",
    kdf: "PBKDF2",
    hash: "SHA-256",
    iterations: ENCRYPTION_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptString(
  envelope: EncryptedPayloadEnvelope,
  passphrase: string,
) {
  if (
    envelope.algorithm !== "AES-GCM" ||
    envelope.kdf !== "PBKDF2" ||
    envelope.hash !== "SHA-256" ||
    envelope.iterations !== ENCRYPTION_ITERATIONS
  ) {
    throw new Error("Unsupported encrypted payload format.");
  }

  const cryptoImpl = getCrypto();
  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const key = await deriveAesKey(passphrase, salt);
  const plaintext = await cryptoImpl.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(base64ToBytes(envelope.ciphertext)),
  );

  return new TextDecoder().decode(plaintext);
}
