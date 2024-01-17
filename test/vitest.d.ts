declare global {
    namespace jest {
      interface Matchers<R> {
        toOutputChallenge(bytes: number[] | Uint8Array): R
      }
    }
  }
  
  export {}