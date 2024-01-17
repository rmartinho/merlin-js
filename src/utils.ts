import { Rng } from './merlin'

export function u32le(n: number): Uint8Array {
  const buffer = new ArrayBuffer(4)
  new DataView(buffer).setUint32(0, n, true)
  return new Uint8Array(buffer)
}
declare const globalThis: {
  crypto: {
    getRandomValues(buffer: Uint8Array): void
  }
}
export const webcryptoRng: Rng = {
  fillBytes(buffer) {
    globalThis.crypto.getRandomValues(bufferOf(buffer))
  },
}
export function bufferOf(lengthOrBuffer: number | ArrayBufferView): Uint8Array {
  return typeof lengthOrBuffer == 'number'
    ? new Uint8Array(lengthOrBuffer)
    : new Uint8Array(
        lengthOrBuffer.buffer,
        lengthOrBuffer.byteOffset,
        lengthOrBuffer.byteLength
      )
}
