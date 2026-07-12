import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

type FlatLocale = Readonly<Record<string, string>>;

const localesRoot = path.join(__dirname, '..', 'i18n', 'locales');

const flattenLocale = (
  value: unknown,
  prefix = '',
  output: Record<string, string> = {},
): FlatLocale => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Locale namespace "${prefix || '<root>'}" must be an object.`);
  }

  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') {
      output[fullKey] = child;
    } else {
      flattenLocale(child, fullKey, output);
    }
  }

  return output;
};

const loadLocale = (locale: string): FlatLocale => {
  const file = path.join(localesRoot, locale, 'common.json');
  return flattenLocale(JSON.parse(readFileSync(file, 'utf8')) as unknown);
};

const interpolationVariables = (value: string): readonly string[] =>
  [...value.matchAll(/{{\s*([\w.]+)(?:\s*,[^}]*)?}}/g)]
    .map((match) => match[1] ?? '')
    .filter(Boolean)
    .sort();

describe('i18n locale catalogs', () => {
  const localeNames = readdirSync(localesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const english = loadLocale('en');
  const englishKeys = Object.keys(english).sort();

  it('keeps every supported locale structurally aligned with English', () => {
    for (const locale of localeNames) {
      expect(Object.keys(loadLocale(locale)).sort()).toEqual(englishKeys);
    }
  });

  it('keeps translations real, non-empty, and free of language-prefix placeholders', () => {
    for (const locale of localeNames) {
      for (const [key, value] of Object.entries(loadLocale(locale))) {
        expect(value.trim()).not.toBe('');
        expect({ key, locale, value }).not.toEqual(
          expect.objectContaining({ value: expect.stringMatching(/^\[[A-Z-]+]\s/) }),
        );
      }
    }
  });

  it('preserves interpolation variables in every translation', () => {
    for (const locale of localeNames) {
      const translations = loadLocale(locale);
      for (const key of englishKeys) {
        expect(interpolationVariables(translations[key] ?? '')).toEqual(
          interpolationVariables(english[key] ?? ''),
        );
      }
    }
  });
});
