export type LanguageCode =
  | 'auto'
  | 'af'
  | 'ar'
  | 'az'
  | 'bg'
  | 'bn'
  | 'bs'
  | 'ca'
  | 'cs'
  | 'cy'
  | 'da'
  | 'de'
  | 'el'
  | 'en'
  | 'es'
  | 'et'
  | 'fa'
  | 'fi'
  | 'fr'
  | 'ga'
  | 'gl'
  | 'gu'
  | 'he'
  | 'hi'
  | 'hr'
  | 'hu'
  | 'id'
  | 'it'
  | 'ja'
  | 'ka'
  | 'kn'
  | 'ko'
  | 'lt'
  | 'lv'
  | 'mk'
  | 'ml'
  | 'mr'
  | 'ms'
  | 'nl'
  | 'no'
  | 'pa'
  | 'pl'
  | 'pt'
  | 'ro'
  | 'ru'
  | 'sk'
  | 'sl'
  | 'sq'
  | 'sr'
  | 'sv'
  | 'sw'
  | 'ta'
  | 'te'
  | 'th'
  | 'tl'
  | 'tr'
  | 'uk'
  | 'ur'
  | 'vi'
  | 'zh';

export type SupportedLanguage = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  deeplTargetCode?: string;
  googleCode: string;
};

export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = [
  { code: 'auto', name: 'Auto Detect', nativeName: 'Auto', googleCode: 'auto' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', googleCode: 'af' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', googleCode: 'ar' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycanca', googleCode: 'az' },
  {
    code: 'bg',
    name: 'Bulgarian',
    nativeName: 'Български',
    deeplTargetCode: 'BG',
    googleCode: 'bg',
  },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', googleCode: 'bn' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', googleCode: 'bs' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', googleCode: 'ca' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', deeplTargetCode: 'CS', googleCode: 'cs' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', googleCode: 'cy' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', deeplTargetCode: 'DA', googleCode: 'da' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', deeplTargetCode: 'DE', googleCode: 'de' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', deeplTargetCode: 'EL', googleCode: 'el' },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    deeplTargetCode: 'EN-US',
    googleCode: 'en',
  },
  { code: 'es', name: 'Spanish', nativeName: 'Español', deeplTargetCode: 'ES', googleCode: 'es' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', deeplTargetCode: 'ET', googleCode: 'et' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', googleCode: 'fa' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', deeplTargetCode: 'FI', googleCode: 'fi' },
  { code: 'fr', name: 'French', nativeName: 'Français', deeplTargetCode: 'FR', googleCode: 'fr' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', googleCode: 'ga' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', googleCode: 'gl' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', googleCode: 'gu' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', googleCode: 'he' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', googleCode: 'hi' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', deeplTargetCode: 'HR', googleCode: 'hr' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', deeplTargetCode: 'HU', googleCode: 'hu' },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    deeplTargetCode: 'ID',
    googleCode: 'id',
  },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', deeplTargetCode: 'IT', googleCode: 'it' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', deeplTargetCode: 'JA', googleCode: 'ja' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', googleCode: 'ka' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', googleCode: 'kn' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', deeplTargetCode: 'KO', googleCode: 'ko' },
  {
    code: 'lt',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    deeplTargetCode: 'LT',
    googleCode: 'lt',
  },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', deeplTargetCode: 'LV', googleCode: 'lv' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', googleCode: 'mk' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', googleCode: 'ml' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', googleCode: 'mr' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', googleCode: 'ms' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', deeplTargetCode: 'NL', googleCode: 'nl' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', googleCode: 'no' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', googleCode: 'pa' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', deeplTargetCode: 'PL', googleCode: 'pl' },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    deeplTargetCode: 'PT-BR',
    googleCode: 'pt',
  },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', deeplTargetCode: 'RO', googleCode: 'ro' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', deeplTargetCode: 'RU', googleCode: 'ru' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', deeplTargetCode: 'SK', googleCode: 'sk' },
  {
    code: 'sl',
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    deeplTargetCode: 'SL',
    googleCode: 'sl',
  },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', googleCode: 'sq' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', googleCode: 'sr' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', deeplTargetCode: 'SV', googleCode: 'sv' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', googleCode: 'sw' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', googleCode: 'ta' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', googleCode: 'te' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', googleCode: 'th' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', googleCode: 'tl' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', deeplTargetCode: 'TR', googleCode: 'tr' },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    deeplTargetCode: 'UK',
    googleCode: 'uk',
  },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', googleCode: 'ur' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', googleCode: 'vi' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', deeplTargetCode: 'ZH', googleCode: 'zh' },
];

export const DEFAULT_TARGET_LANGUAGE: LanguageCode = 'en';
