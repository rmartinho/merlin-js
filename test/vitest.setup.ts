import { expect } from 'vitest'

import { Transcript } from '../src/merlin'

expect.extend({
  toOutputChallenge(received: Transcript, bytes: number[] | Uint8Array) {
    if (Array.isArray(bytes)) {
      bytes = new Uint8Array(bytes)
    }

    const out = received.clone().challengeBytes('test', bytes.length)
    const pass: boolean = this.equals(out, bytes)
    return {
      pass,
      expected: bytes,
      received: out,
      message: () =>
        `${this.utils.matcherHint(
          'toOutputChallenge',
          'transcript',
          'bytes',
          this
        )}`,
    }
  },
})
