export type OfflinePhrase = {
  id: string;
  category: string;
  source: string;
  translation: string;
};

const categories = ['Arrival', 'Food', 'Emergency', 'Shopping', 'Transport', 'Hotel', 'Small Talk'];

export const buildOfflinePhrasePack = (countryCode: string): readonly OfflinePhrase[] =>
  Array.from({ length: 500 }, (_, index) => {
    const category = categories[index % categories.length] ?? 'Travel';
    const number = index + 1;
    return {
      id: `${countryCode}-${number}`,
      category,
      source: `Essential ${category.toLowerCase()} phrase ${number}`,
      translation: `[${countryCode.toUpperCase()}] Essential ${category.toLowerCase()} phrase ${number}`,
    };
  });
