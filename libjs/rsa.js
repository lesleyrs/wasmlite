import { memory } from './loader.js'
import { ptrToString } from './utils.js'

// NOTE: only used for rs2 client

export function rsaCrypt(exp, mod, temp, length, enc) {
  const bigRaw = bytesToBigInt(memory.u8.subarray(temp, temp + length));
  const bigEnc = bigIntModPow(bigRaw, BigInt(ptrToString(exp)), BigInt(ptrToString(mod)));
  const rawEnc = bigIntToBytes(bigEnc);

  memory.u8.set(rawEnc, enc);
  return rawEnc.length;
}

function bytesToBigInt(bytes) {
  let result = 0n;
  for (let index = 0; index < bytes.length; index++) {
    result = (result << 8n) | BigInt(bytes[index]);
  }
  return result;
}

function bigIntToBytes(bigInt) {
  const bytes = [];
  while (bigInt > 0n) {
    bytes.unshift(Number(bigInt & 0xffn));
    bigInt >>= 8n;
  }

  if (bytes[0] & 0x80) {
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

function bigIntModPow(base, exponent, modulus) {
  let result = 1n;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    base = (base * base) % modulus;
    exponent >>= 1n;
  }
  return result;
}
