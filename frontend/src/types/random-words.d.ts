// `random-words` ships no types -- a minimal shim covering the one call
// shape this app actually uses (generate(count) -> string[]).
declare module "random-words" {
  export function generate(count: number): string[];
}
