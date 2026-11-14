if (!window.eelib) window.eelib = {}
window.eelib.nav = {
    leftBtn: 'none',
    downStyle: 'floating',
    noName: false,
    noIcon: false,
}
window.eelib.theme = {
    blackDown: true,
}

window.eelib.pages = [
    {
        id: 'poll',
        title: window.pollLocales?.ru?.strings?.navTitle || 'Poll',
        description: window.pollLocales?.ru?.strings?.description || '',
        icon: 'img/ui/home.svg',
        active: true,
        btns: [],
        leftBtn: 'none',
        subpages: [],
        subpagesmode: 'modal',
        noBottom: true,
        noNav: true,
        noLeft: true,
    },
    {
        id: 'end',
        title: 'End',
        icon: 'img/ui/user.svg',
        noBottom: true,
        noNav: true,
        noLeft: true,
    },
    {
        id: 'about',
        title: 'About',
        icon: 'img/ui/user.svg',
        noBottom: true,
        noNav: true,
    },
    {
        id: 'settings',
        title: 'Настройки',
        icon: 'img/ui/settings.svg',
        noBottom: true,
    },
];

window.eelib.settingsConfig = {
    storageKey: 'appSettings',
    defaultSettings: {
        main: {
            lang: navigator.language.split('-')[0] || 'en',
            theme: 'dark'
        },
    },
    schema: {
        main: {
            title: "Main",
            items: [
                {
                    type: "select",
                    key: "lang",
                    label: "Language",
                    options: {
                        en: "English",
                        ru: "Русский",
                        uk: "Українська",
                    },
                },
                {
                    type: "select",
                    key: "theme",
                    label: "Theme",
                    options: { "dark": "Dark", "light": "Light", "oled": "Black OLED" }
                },
            ]
        },
    },
    onChange: (settings) => {
        window.weatherManager?.refresh();
    }
}
