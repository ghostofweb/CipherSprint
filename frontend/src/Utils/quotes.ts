// The quote set lives in the shared package so the race server can pick the
// same text a solo test would; this file keeps the old import path working.
export { quotes, getRandomQuote } from "@ciphersprint/shared";
export type { Quote, QuoteLength } from "@ciphersprint/shared";
