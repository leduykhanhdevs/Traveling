import type { LanguageCode } from '../constants/languages.js';

export type TranslationMode = 'keyboard' | 'voice' | 'camera';

export type TranslateRequest = {
  sourceText: string;
  sourceLang?: LanguageCode;
  targetLang: LanguageCode;
};

export type PronunciationGuide = {
  ipa: string;
  romanization: string;
};

export type TranslateResponse = {
  sourceText: string;
  translatedText: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  provider: 'deepl' | 'google';
  pronunciation: PronunciationGuide;
  cached: boolean;
};

export type OcrTranslateRequest = {
  imageBase64: string;
  targetLang: LanguageCode;
};

export type OcrTextBlock = {
  text: string;
  translatedText: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type OcrTranslateResponse = {
  blocks: readonly OcrTextBlock[];
};
