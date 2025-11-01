import { computed, shallowRef } from 'vue';
import { useAppStore } from '@/stores/stores';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

export function useLanguage() {
  const store = useAppStore();
  const { account, misc } = storeToRefs(store);

  const { locale: i18nLocale } = useI18n();

  // TODO this needs to go into an API
  const _languageList = shallowRef([
    { language: 'en', ocr: 'eng', label: 'English' },
    { language: 'zh', ocr: 'chi_sim', label: '中国人' },
    { language: '', ocr: '', label: 'Chinese traditional' },
    { language: '', ocr: '', label: 'Nederlands' },
    { language: '', ocr: '', label: 'Français' },
    { language: '', ocr: '', label: 'русский' },
    { language: '', ocr: '', label: 'Italiana' },
    { language: '', ocr: '', label: 'Deutsch' },
  ]);

  const gitHubTranslateUrl =
    'https://github.com/blikvm/blikvm-web-client/tree/master/src/utils/locales';

  // Return the full language list with all fields (language, ocr, label)
  const ocrLanguageList = computed(() => {
    return languageList.value.filter((item) => item.ocr !== '');
  });

  // Return the language list with all fields (language, ocr, label)
  const languageList = computed(() => _languageList.value.filter((item) => item.language));

  const currentLanguage = computed(() => {
    const selectedLanguage = languageList.value.find(
      (item) => item.language === misc.value.language
    );
    return selectedLanguage ? selectedLanguage.label : account.value.language;
  });

  const filteredLanguageList = languageList.value.filter(
    (item) => item.label !== currentLanguage.value
  );

  const setLanguage = (value) => {
    console.log(value);
    // i18nLocale.value = value;
    account.value.language = value;
  };

  return {
    ocrLanguageList,
    languageList,
    filteredLanguageList,
    currentLanguage,
    setLanguage,
    gitHubTranslateUrl,
  };
}
