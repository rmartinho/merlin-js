/// <reference path="vitest.d.ts" />

import { test, expect } from 'vitest'
import { ChaChaRng } from 'randchacha'

import { Transcript } from '../src/merlin'
import { utf8 } from '@rmf/strobe/dist/utils'

test('simple protocol', () => {
  const transcript = new Transcript('test-simple')

  transcript.appendMessage('some label', 'some data')

  expect(transcript).toOutputChallenge([
    58, 107, 21, 146, 116, 91, 146, 32, 152, 191, 44, 229, 211, 229, 203, 218,
    84, 199, 252, 150, 201, 209, 202, 162, 81, 30, 121, 198, 226, 52, 97, 45,
  ])
})

test('complex protocol', () => {
  const transcript = new Transcript('test-complex')

  transcript.appendMessage('step1', 'some data')

  for (let i = 0; i < 32; ++i) {
    const challenge = transcript.challengeBytes('challenge', 32)
    transcript.appendMessage('bigdata', new Uint8Array(1024).fill(99))
    transcript.appendMessage('challengedata', challenge)
  }

  expect(transcript).toOutputChallenge([
    69, 30, 54, 210, 32, 118, 84, 31, 55, 170, 163, 181, 37, 165, 136, 54, 255,
    3, 175, 196, 38, 248, 167, 116, 226, 119, 173, 181, 140, 61, 14, 34,
  ])
})

test('transcript RNG is bound to transcript and witnesses', () => {
  const proto = 'test-rng-collisions'
  const commitment1 = 'commitment data 1'
  const commitment2 = 'commitment data 2'
  const witness1 = utf8('witness data 1')
  const witness2 = utf8('witness data 2')

  const t1 = new Transcript(proto)
  const t2 = new Transcript(proto)
  const t3 = new Transcript(proto)
  const t4 = new Transcript(proto)

  t1.appendMessage('com', commitment1)
  t2.appendMessage('com', commitment2)
  t3.appendMessage('com', commitment2)
  t4.appendMessage('com', commitment2)

  const r1 = t1
    .buildRng()
    .rekeyWithWitnessBytes('witness', witness1)
    .finalize(new ChaChaRng(new Uint8Array(32)))
  const r2 = t2
    .buildRng()
    .rekeyWithWitnessBytes('witness', witness1)
    .finalize(new ChaChaRng(new Uint8Array(32)))
  const r3 = t3
    .buildRng()
    .rekeyWithWitnessBytes('witness', witness2)
    .finalize(new ChaChaRng(new Uint8Array(32)))
  const r4 = t4
    .buildRng()
    .rekeyWithWitnessBytes('witness', witness2)
    .finalize(new ChaChaRng(new Uint8Array(32)))

  const b1 = r1.fillBytes(32)
  const b2 = r2.fillBytes(32)
  const b3 = r3.fillBytes(32)
  const b4 = r4.fillBytes(32)

  expect(b1).not.toEqual(b2)
  expect(b1).not.toEqual(b3)
  expect(b1).not.toEqual(b4)

  expect(b2).not.toEqual(b3)
  expect(b2).not.toEqual(b4)

  expect(b3).toEqual(b4)
})
