if (!window.pollLocales) window.pollLocales = {};
window.pollLocales.uk = {
    name: "Українська",
    ready: false,
    notice: "Український переклад ще не підготовлено. Зараз показано російську версію анкети.",
    strings: Object.fromEntries(Object.keys(window.pollLocales.ru.strings).map((key) => [key, ""])),
};
