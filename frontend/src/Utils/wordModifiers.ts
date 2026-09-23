// Punctuation/number injection lives in the shared package (the race server
// applies the same rules when it builds a race's text); this file keeps the
// old import path working.
export { applyPunctuation, applyNumbers } from "@ciphersprint/shared";
