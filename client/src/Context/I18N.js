import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import englishTranslation from "../Content/Languages/en";
import spanishTranslation from "../Content/Languages/es";

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(
    {
      fallbackLng: "en",
      supportedLngs: ["en", "es"],
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
      },
    }
  );

export default i18n;
