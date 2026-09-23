// `random-words` ships types that do not match its exports -- a minimal shim
// covering what this app uses.
declare module "random-words" {
  export function generate(count: number): string[];
  // The full English list (about 1,950 words).
  export const wordList: string[];
}
