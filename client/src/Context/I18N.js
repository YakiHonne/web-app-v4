import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import englishTranslation from "../Content/Languages/en";
import spanishTranslation from "../Content/Languages/es";
import chineseTranslation from "../Content/Languages/zh-cn";
import { getAppLang, handleAppDirection } from "../Helpers/Helpers";
import portTranslation from "../Content/Languages/pt";
import japaneseTranslation from "../Content/Languages/ja";
import thaiTranslation from "../Content/Languages/th";
import arabicTranslation from "../Content/Languages/ar";
import italianTranslation from "../Content/Languages/it";

const supportedLanguage = [
  {
    display_name: "English",
    value: "en",
    left_el: <div className="flag-en"></div>,
    disabled: false,
  },
  {
    display_name: "中国人",
    value: "zh",
    left_el: <div className="flag-zh"></div>,
    disabled: false,
  },
  {
    display_name: "Español",
    value: "es",
    left_el: <div className="flag-es"></div>,
    disabled: false,
  },
  {
    display_name: "Português",
    value: "pt",
    left_el: <div className="flag-pt"></div>,
    disabled: false,
  },
  {
    display_name: "Italiano",
    value: "it",
    left_el: <div className="flag-it"></div>,
    disabled: false,
  },
  {
    display_name: "แบบไทย",
    value: "th",
    left_el: <div className="flag-th"></div>,
    disabled: false,
  },
  {
    display_name: "日本語",
    value: "ja",
    left_el: <div className="flag-ja"></div>,
    disabled: false,
  },
  {
    display_name: "العربية",
    value: "ar",
    left_el: <div className="flag-ar"></div>,
    disabled: true,
  },
];

const supportedLanguageKeys = ["en", "zh", "es", "it", "pt", "th", "ja"];
// const supportedLanguageKeys = ["en", "es", "zh", "pt", "ja", "th", "ar"];

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: supportedLanguageKeys,
    debug: true,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: { ...englishTranslation },
      },
      es: {
        translation: { ...spanishTranslation },
      },
      zh: {
        translation: { ...chineseTranslation },
      },
      pt: {
        translation: { ...portTranslation },
      },
      ja: {
        translation: { ...japaneseTranslation },
      },
      th: {
        translation: { ...thaiTranslation },
      },
      ar: {
        translation: { ...arabicTranslation },
      },
      it: {
        translation: { ...italianTranslation },
      },
    },
  });

function detectBrowserLanguage() {
  let lang = getAppLang();
  i18n.changeLanguage(lang);
}

detectBrowserLanguage();
handleAppDirection();

export default i18n;

export { supportedLanguageKeys, supportedLanguage };
