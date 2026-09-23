import { generate } from 'random-words';
import type { Language } from '@ciphersprint/shared';

export const LANGUAGE_NAMES: Record<Language, string> = {
    english: 'English',
    spanish: 'Español',
    french: 'Français',
    german: 'Deutsch',
    portuguese: 'Português',
    italian: 'Italiano',
    indonesian: 'Bahasa Indonesia',
    hinglish: 'Hinglish',
};

type LanguageModule = typeof import('@ciphersprint/shared/src/languages');
let languages: LanguageModule | null = null;
let loading: Promise<LanguageModule> | null = null;

// The non-English lists load on first use (their own small chunk).
export function loadLanguages(): Promise<LanguageModule> {
    if (languages) return Promise.resolve(languages);
    if (!loading) {
        loading = import('@ciphersprint/shared/src/languages').then((m) => {
            languages = m;
            return m;
        });
    }
    return loading;
}

export const languagesReady = () => languages !== null;

// Random test words in a language. Falls back to English until a list has
// loaded (the caller reloads the test once it has).
export function randomWords(count: number, language: Language = 'english'): string[] {
    if (language !== 'english' && languages) {
        const words = languages.randomWordsFor(language, count);
        if (words.length) return words;
    }
    return generate(count);
}
