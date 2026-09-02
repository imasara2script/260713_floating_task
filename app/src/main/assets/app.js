function getTranslation(key, ...args) {
    let text = (translations[currentLang] && translations[currentLang][key]) || translations['en'][key] || key;
    args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
    });
    return text;
}

function updateLanguagePreference() {
    const select = document.getElementById('languageSelect');
    const lang = select.value;
    localStorage.setItem('appLanguage', lang);
    applyLanguage();
    if (typeof Android !== 'undefined' && Android.setAppLanguage) {
        Android.setAppLanguage(lang);
    }
}
