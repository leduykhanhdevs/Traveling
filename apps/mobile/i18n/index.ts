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

import { usePreferencesStore } from '../stores/preferencesStore';
const storedLocale = usePreferencesStore.getState().appLocale;
const deviceLanguage = storedLocale ?? getLocales()[0]?.languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage, // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    defaultNS: 'common',
  });

export default i18n;
