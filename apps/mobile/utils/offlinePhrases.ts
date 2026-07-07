export type OfflinePhrase = {
  id: string;
  category: string;
  source: string;
  translation: string;
};

const enPhrases = [
  { id: '1', category: 'Arrival', source: 'Where is the baggage claim?' },
  { id: '2', category: 'Arrival', source: 'I need a taxi.' },
  { id: '3', category: 'Arrival', source: 'How much is the fare?' },
  { id: '4', category: 'Food', source: 'A table for two, please.' },
  { id: '5', category: 'Food', source: 'Can I see the menu?' },
  { id: '6', category: 'Food', source: 'The check, please.' },
  { id: '7', category: 'Emergency', source: 'I need a doctor.' },
  { id: '8', category: 'Emergency', source: 'Call the police.' },
  { id: '9', category: 'Emergency', source: 'Where is the hospital?' },
  { id: '10', category: 'Shopping', source: 'How much does this cost?' },
  { id: '11', category: 'Shopping', source: 'Do you take credit cards?' },
  { id: '12', category: 'Transport', source: 'Where is the nearest train station?' },
  { id: '13', category: 'Transport', source: 'One ticket, please.' },
  { id: '14', category: 'Small Talk', source: 'Hello' },
  { id: '15', category: 'Small Talk', source: 'Thank you' },
  { id: '16', category: 'Small Talk', source: 'Excuse me' },
  { id: '17', category: 'Small Talk', source: 'Do you speak English?' },
];

const translations: Record<string, Record<string, string>> = {
  vi: {
    '1': 'Chỗ nhận hành lý ở đâu?', '2': 'Tôi cần một chiếc taxi.', '3': 'Giá vé là bao nhiêu?',
    '4': 'Cho một bàn hai người.', '5': 'Tôi có thể xem thực đơn không?', '6': 'Vui lòng thanh toán.',
    '7': 'Tôi cần bác sĩ.', '8': 'Gọi cảnh sát.', '9': 'Bệnh viện ở đâu?',
    '10': 'Cái này giá bao nhiêu?', '11': 'Bạn có nhận thẻ tín dụng không?', '12': 'Ga tàu gần nhất ở đâu?',
    '13': 'Cho một vé.', '14': 'Xin chào', '15': 'Cảm ơn', '16': 'Xin lỗi', '17': 'Bạn có nói tiếng Anh không?'
  },
  es: {
    '1': '¿Dónde está el reclamo de equipaje?', '2': 'Necesito un taxi.', '3': '¿Cuánto es la tarifa?',
    '4': 'Una mesa para dos, por favor.', '5': '¿Puedo ver el menú?', '6': 'La cuenta, por favor.',
    '7': 'Necesito un médico.', '8': 'Llame a la policía.', '9': '¿Dónde está el hospital?',
    '10': '¿Cuánto cuesta esto?', '11': '¿Aceptan tarjetas de crédito?', '12': '¿Dónde está la estación de tren más cercana?',
    '13': 'Un billete, por favor.', '14': 'Hola', '15': 'Gracias', '16': 'Disculpe', '17': '¿Habla inglés?'
  },
  fr: {
    '1': 'Où est le retrait des bagages?', '2': 'J\'ai besoin d\'un taxi.', '3': 'Combien coûte le trajet?',
    '4': 'Une table pour deux, s\'il vous plaît.', '5': 'Puis-je voir le menu?', '6': 'L\'addition, s\'il vous plaît.',
    '7': 'J\'ai besoin d\'un médecin.', '8': 'Appelez la police.', '9': 'Où est l\'hôpital?',
    '10': 'Combien ça coûte?', '11': 'Acceptez-vous les cartes de crédit?', '12': 'Où est la gare la plus proche?',
    '13': 'Un billet, s\'il vous plaît.', '14': 'Bonjour', '15': 'Merci', '16': 'Excusez-moi', '17': 'Parlez-vous anglais?'
  },
};

export const buildOfflinePhrasePack = (countryCode: string): readonly OfflinePhrase[] => {
  const code = countryCode.toLowerCase();
  const dict = translations[code] || {};
  return enPhrases.map(phrase => ({
    ...phrase,
    id: `${code}-${phrase.id}`,
    translation: dict[phrase.id] || `[${countryCode.toUpperCase()}] ${phrase.source}`,
  }));
};
