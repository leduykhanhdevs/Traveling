const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../i18n/locales');
const enFile = path.join(localesDir, 'en/common.json');
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

const targets = ['vi', 'zh-CN', 'es', 'hi', 'fr', 'ar', 'pt', 'ru', 'ja'];

async function translateText(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(x => x[0]).join('');
  } catch (e) {
    console.error(`Failed to translate "${text}" to ${targetLang}`, e);
    return text;
  }
}

async function translateObj(obj, targetLang) {
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      // Don't translate placeholders like {{failed}}
      const parts = val.split(/(\{\{[^}]+\}\})/g);
      let translated = '';
      for (const part of parts) {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          translated += part;
        } else if (part.trim().length > 0) {
          translated += await translateText(part, targetLang);
        } else {
          translated += part;
        }
      }
      result[key] = translated;
    } else if (typeof val === 'object' && val !== null) {
      result[key] = await translateObj(val, targetLang);
    }
  }
  return result;
}

async function main() {
  for (const lang of targets) {
    console.log(`Translating to ${lang}...`);
    const langDir = path.join(localesDir, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    const translated = await translateObj(enData, lang);
    fs.writeFileSync(path.join(langDir, 'common.json'), JSON.stringify(translated, null, 2));
    console.log(`Finished ${lang}`);
  }
}

main().catch(console.error);
