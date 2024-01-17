import { Strobe } from '@rmf1723/strobe-js'
import { u32le, utf8, webcryptoRng, bufferOf } from './utils.js'

const MERLIN_PROTOCOL_LABEL = 'Merlin v1.0'

export class Transcript {
  #strobe: Strobe

  constructor(label: string)
  constructor(source: Transcript)
  constructor(labelOrSource: string | Transcript) {
    if (labelOrSource instanceof Transcript) {
      const source = labelOrSource
      this.#strobe = source.#strobe.clone()
    } else {
      const label = labelOrSource
      this.#strobe = new Strobe(MERLIN_PROTOCOL_LABEL, 128)
      this.appendMessage('dom-sep', label)
    }
  }

  clone() {
    return new Transcript(this)
  }

  appendMessage(label: string, message: string | ArrayBufferView): void {
    if (typeof message == 'string') {
      message = utf8(message)
    }

    this.#strobe.metaAD(label)
    this.#strobe.metaAD(u32le(message.byteLength), { more: true })
    this.#strobe.AD(message)
  }

  challengeBytes(label: string, legnth: number): Uint8Array
  challengeBytes(label: string, buffer: ArrayBufferView): void
  challengeBytes(
    label: string,
    lengthOrBuffer: number | ArrayBufferView
  ): Uint8Array | void {
    const buffer = bufferOf(lengthOrBuffer)

    this.#strobe.metaAD(label)
    this.#strobe.metaAD(u32le(buffer.byteLength), { more: true })
    this.#strobe.PRF(buffer)
    return buffer
  }

  buildRng(): TranscriptRngBuilder {
    const strobe = this.#strobe.clone()
    return {
      rekeyWithWitnessBytes(label, witness) {
        strobe.metaAD(label)
        strobe.metaAD(u32le(witness.byteLength), { more: true })
        strobe.KEY(witness)
        return this
      },
      finalize(rng = webcryptoRng) {
        const entropy = new Uint8Array(32)
        rng.fillBytes(entropy)
        strobe.metaAD('rng')
        strobe.KEY(entropy)
        return {
          fillBytes(lengthOrBuffer) {
            const buffer = bufferOf(lengthOrBuffer)

            strobe.metaAD(u32le(buffer.byteLength))
            strobe.PRF(buffer)
            return buffer
          },
        }
      },
    }
  }
}

export interface Rng {
  fillBytes(buffer: ArrayBufferView): void
}

export interface TranscriptRngBuilder {
  rekeyWithWitnessBytes(
    label: string,
    witness: ArrayBufferView
  ): TranscriptRngBuilder
  finalize(rng?: Rng): TranscriptRng
}

export interface TranscriptRng {
  fillBytes(buffer: ArrayBufferView): void
  fillBytes(length: number): Uint8Array
}
