import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import enCommon from './locales/en/common.json';
import viCommon from './locales/vi/common.json';
import zhCNCommon from './locales/zh-CN/common.json';
import esCommon from './locales/es/common.json';
import hiCommon from './locales/hi/common.json';
import frCommon from './locales/fr/common.json';
import arCommon from './locales/ar/common.json';
import ptCommon from './locales/pt/common.json';
import ruCommon from './locales/ru/common.json';
import jaCommon from './locales/ja/common.json';

const resources = {
  en: { common: enCommon },
  vi: { common: viCommon },
  'zh-CN': { common: zhCNCommon },
  es: { common: esCommon },
  hi: { common: hiCommon },
  fr: { common: frCommon },
  ar: { common: arCommon },
  pt: { common: ptCommon },
  ru: { common: ruCommon },
  ja: { common: jaCommon },
};

export type AppLocale = keyof typeof resources;

const supportedLocales = new Set<AppLocale>(Object.keys(resources) as AppLocale[]);

export const normalizeAppLocale = (value: string | null | undefined): AppLocale => {
  const normalized = value?.trim().replace('_', '-').toLowerCase();
  if (!normalized) return 'en';
  if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh-CN';

  const language = normalized.split('-')[0] ?? 'en';
  return supportedLocales.has(language as AppLocale) ? (language as AppLocale) : 'en';
};

import { usePreferencesStore } from '../stores/preferencesStore';
const storedLocale = usePreferencesStore.getState().appLocale;
const deviceLanguage = normalizeAppLocale(storedLocale ?? getLocales()[0]?.languageTag);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    supportedLngs: Object.keys(resources),
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    defaultNS: 'common',
  });

usePreferencesStore.subscribe((state, previousState) => {
  if (state.appLocale === previousState.appLocale) return;
  const nextLocale = normalizeAppLocale(state.appLocale);
  if (i18n.resolvedLanguage !== nextLocale) {
    void i18n.changeLanguage(nextLocale);
  }
});

export default i18n;
