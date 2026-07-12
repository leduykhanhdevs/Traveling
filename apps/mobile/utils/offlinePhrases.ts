export type OfflinePhraseCategory =
  'arrival' | 'food' | 'emergency' | 'shopping' | 'transport' | 'small-talk';

export type OfflinePhrase = {
  id: string;
  category: OfflinePhraseCategory;
  source: string;
  translation: string;
};

const englishPhrases = [
  { id: '1', category: 'arrival', source: 'Where is the baggage claim?' },
  { id: '2', category: 'arrival', source: 'I need a taxi.' },
  { id: '3', category: 'arrival', source: 'How much is the fare?' },
  { id: '4', category: 'food', source: 'A table for two, please.' },
  { id: '5', category: 'food', source: 'Can I see the menu?' },
  { id: '6', category: 'food', source: 'The check, please.' },
  { id: '7', category: 'emergency', source: 'I need a doctor.' },
  { id: '8', category: 'emergency', source: 'Call the police.' },
  { id: '9', category: 'emergency', source: 'Where is the hospital?' },
  { id: '10', category: 'shopping', source: 'How much does this cost?' },
  { id: '11', category: 'shopping', source: 'Do you take credit cards?' },
  { id: '12', category: 'transport', source: 'Where is the nearest train station?' },
  { id: '13', category: 'transport', source: 'One ticket, please.' },
  { id: '14', category: 'small-talk', source: 'Hello' },
  { id: '15', category: 'small-talk', source: 'Thank you' },
  { id: '16', category: 'small-talk', source: 'Excuse me' },
  { id: '17', category: 'small-talk', source: 'Do you speak English?' },
] as const satisfies readonly {
  id: string;
  category: OfflinePhraseCategory;
  source: string;
}[];

type OfflinePhraseId = (typeof englishPhrases)[number]['id'];
type OfflinePhraseLocale = 'ar' | 'en' | 'es' | 'fr' | 'hi' | 'ja' | 'pt' | 'ru' | 'vi' | 'zh-CN';
type OfflineTranslations = Record<OfflinePhraseId, string>;

const translations = {
  ar: {
    '1': 'أين منطقة استلام الأمتعة؟',
    '2': 'أحتاج إلى سيارة أجرة.',
    '3': 'كم تبلغ الأجرة؟',
    '4': 'طاولة لشخصين، من فضلك.',
    '5': 'هل يمكنني رؤية قائمة الطعام؟',
    '6': 'الحساب، من فضلك.',
    '7': 'أحتاج إلى طبيب.',
    '8': 'اتصل بالشرطة.',
    '9': 'أين المستشفى؟',
    '10': 'كم سعر هذا؟',
    '11': 'هل تقبلون بطاقات الائتمان؟',
    '12': 'أين أقرب محطة قطار؟',
    '13': 'تذكرة واحدة، من فضلك.',
    '14': 'مرحبًا',
    '15': 'شكرًا لك',
    '16': 'عذرًا',
    '17': 'هل تتحدث الإنجليزية؟',
  },
  en: Object.fromEntries(
    englishPhrases.map(({ id, source }) => [id, source]),
  ) as OfflineTranslations,
  es: {
    '1': '¿Dónde está la recogida de equipaje?',
    '2': 'Necesito un taxi.',
    '3': '¿Cuánto cuesta el trayecto?',
    '4': 'Una mesa para dos, por favor.',
    '5': '¿Puedo ver el menú?',
    '6': 'La cuenta, por favor.',
    '7': 'Necesito un médico.',
    '8': 'Llame a la policía.',
    '9': '¿Dónde está el hospital?',
    '10': '¿Cuánto cuesta esto?',
    '11': '¿Aceptan tarjetas de crédito?',
    '12': '¿Dónde está la estación de tren más cercana?',
    '13': 'Un billete, por favor.',
    '14': 'Hola',
    '15': 'Gracias',
    '16': 'Disculpe',
    '17': '¿Habla inglés?',
  },
  fr: {
    '1': 'Où se trouve la livraison des bagages ?',
    '2': 'J’ai besoin d’un taxi.',
    '3': 'Combien coûte le trajet ?',
    '4': 'Une table pour deux, s’il vous plaît.',
    '5': 'Puis-je voir le menu ?',
    '6': 'L’addition, s’il vous plaît.',
    '7': 'J’ai besoin d’un médecin.',
    '8': 'Appelez la police.',
    '9': 'Où se trouve l’hôpital ?',
    '10': 'Combien cela coûte-t-il ?',
    '11': 'Acceptez-vous les cartes de crédit ?',
    '12': 'Où se trouve la gare la plus proche ?',
    '13': 'Un billet, s’il vous plaît.',
    '14': 'Bonjour',
    '15': 'Merci',
    '16': 'Excusez-moi',
    '17': 'Parlez-vous anglais ?',
  },
  hi: {
    '1': 'सामान प्राप्त करने की जगह कहाँ है?',
    '2': 'मुझे टैक्सी चाहिए।',
    '3': 'किराया कितना है?',
    '4': 'कृपया दो लोगों के लिए एक मेज़।',
    '5': 'क्या मुझे मेन्यू मिल सकता है?',
    '6': 'कृपया बिल दीजिए।',
    '7': 'मुझे डॉक्टर की ज़रूरत है।',
    '8': 'पुलिस को बुलाइए।',
    '9': 'अस्पताल कहाँ है?',
    '10': 'इसकी कीमत कितनी है?',
    '11': 'क्या आप क्रेडिट कार्ड स्वीकार करते हैं?',
    '12': 'सबसे नज़दीकी रेलवे स्टेशन कहाँ है?',
    '13': 'कृपया एक टिकट।',
    '14': 'नमस्ते',
    '15': 'धन्यवाद',
    '16': 'क्षमा कीजिए',
    '17': 'क्या आप अंग्रेज़ी बोलते हैं?',
  },
  ja: {
    '1': '手荷物受取所はどこですか？',
    '2': 'タクシーをお願いします。',
    '3': '料金はいくらですか？',
    '4': '2名用の席をお願いします。',
    '5': 'メニューを見せていただけますか？',
    '6': 'お会計をお願いします。',
    '7': '医者が必要です。',
    '8': '警察を呼んでください。',
    '9': '病院はどこですか？',
    '10': 'これはいくらですか？',
    '11': 'クレジットカードは使えますか？',
    '12': '最寄りの駅はどこですか？',
    '13': 'チケットを1枚お願いします。',
    '14': 'こんにちは',
    '15': 'ありがとうございます',
    '16': 'すみません',
    '17': '英語を話せますか？',
  },
  pt: {
    '1': 'Onde fica a retirada de bagagem?',
    '2': 'Preciso de um táxi.',
    '3': 'Quanto custa a corrida?',
    '4': 'Uma mesa para duas pessoas, por favor.',
    '5': 'Posso ver o cardápio?',
    '6': 'A conta, por favor.',
    '7': 'Preciso de um médico.',
    '8': 'Chame a polícia.',
    '9': 'Onde fica o hospital?',
    '10': 'Quanto custa isto?',
    '11': 'Vocês aceitam cartão de crédito?',
    '12': 'Onde fica a estação de trem mais próxima?',
    '13': 'Uma passagem, por favor.',
    '14': 'Olá',
    '15': 'Obrigado',
    '16': 'Com licença',
    '17': 'Você fala inglês?',
  },
  ru: {
    '1': 'Где находится выдача багажа?',
    '2': 'Мне нужно такси.',
    '3': 'Сколько стоит проезд?',
    '4': 'Столик на двоих, пожалуйста.',
    '5': 'Можно посмотреть меню?',
    '6': 'Счёт, пожалуйста.',
    '7': 'Мне нужен врач.',
    '8': 'Вызовите полицию.',
    '9': 'Где находится больница?',
    '10': 'Сколько это стоит?',
    '11': 'Вы принимаете кредитные карты?',
    '12': 'Где находится ближайшая железнодорожная станция?',
    '13': 'Один билет, пожалуйста.',
    '14': 'Здравствуйте',
    '15': 'Спасибо',
    '16': 'Извините',
    '17': 'Вы говорите по-английски?',
  },
  vi: {
    '1': 'Khu nhận hành lý ở đâu?',
    '2': 'Tôi cần một chiếc taxi.',
    '3': 'Cước phí bao nhiêu?',
    '4': 'Cho tôi một bàn dành cho hai người.',
    '5': 'Cho tôi xem thực đơn được không?',
    '6': 'Cho tôi xin hóa đơn.',
    '7': 'Tôi cần bác sĩ.',
    '8': 'Hãy gọi cảnh sát.',
    '9': 'Bệnh viện ở đâu?',
    '10': 'Cái này giá bao nhiêu?',
    '11': 'Ở đây có nhận thẻ tín dụng không?',
    '12': 'Ga tàu gần nhất ở đâu?',
    '13': 'Cho tôi một vé.',
    '14': 'Xin chào',
    '15': 'Cảm ơn',
    '16': 'Xin lỗi',
    '17': 'Bạn có nói tiếng Anh không?',
  },
  'zh-CN': {
    '1': '行李提取处在哪里？',
    '2': '我需要一辆出租车。',
    '3': '车费是多少？',
    '4': '请给我们一张两人桌。',
    '5': '可以给我看看菜单吗？',
    '6': '请结账。',
    '7': '我需要医生。',
    '8': '请报警。',
    '9': '医院在哪里？',
    '10': '这个多少钱？',
    '11': '你们接受信用卡吗？',
    '12': '最近的火车站在哪里？',
    '13': '请给我一张票。',
    '14': '你好',
    '15': '谢谢',
    '16': '不好意思',
    '17': '你会说英语吗？',
  },
} satisfies Record<OfflinePhraseLocale, OfflineTranslations>;

const localeAliases: Readonly<Record<string, OfflinePhraseLocale>> = {
  ar: 'ar',
  br: 'pt',
  cn: 'zh-CN',
  en: 'en',
  es: 'es',
  fr: 'fr',
  gb: 'en',
  hi: 'hi',
  in: 'hi',
  ja: 'ja',
  jp: 'ja',
  pt: 'pt',
  ru: 'ru',
  us: 'en',
  vi: 'vi',
  vn: 'vi',
  zh: 'zh-CN',
  'zh-cn': 'zh-CN',
};

export const resolveOfflinePhraseLocale = (
  countryOrLanguageCode: string,
): OfflinePhraseLocale | null =>
  localeAliases[countryOrLanguageCode.trim().toLowerCase().replace('_', '-')] ?? null;

export const buildOfflinePhrasePack = (countryOrLanguageCode: string): readonly OfflinePhrase[] => {
  const normalizedCode = countryOrLanguageCode.trim().toLowerCase().replace('_', '-');
  const locale = resolveOfflinePhraseLocale(normalizedCode);
  if (!locale) {
    return [];
  }

  const dictionary = translations[locale];
  return englishPhrases.map((phrase) => ({
    ...phrase,
    id: `${normalizedCode}-${phrase.id}`,
    translation: dictionary[phrase.id],
  }));
};
