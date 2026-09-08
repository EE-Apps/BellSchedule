if (!window.eelib) window.eelib = {}
window.eelib.pages = [
    {
        id: 'now',
        title: 'Now',
        description: 'До перемены в 15 мин',
        icon: 'img/ui/home.svg',
        active: true,
        btns: [
            ['screenshoot', 'img/ui/zoom', 'window.makeScreenshot("#now .pageContent")', 'Screenshot'],
            ['aod', 'img/ui/zoom', 'window.changePage("aod")', 'Allway On Display'],
        ],
        subpages: [
            'lessonInfo',
        ],
        subpagesmode: 'modal',
    },
    {
        id: 'aod',
        title: 'AOD',
        description: 'До следующего звонка',
        icon: 'img/ui/home.svg',
        btns: [],
        leftBtn: 'none',
        noBottom: true,
        noNav: true,
    },
    {
        id: 'schedule',
        title: 'Schedule',
        icon: 'img/ui/notebook.svg',
        btns: [
            ['search'],
            ['edit', 'img/ui/edit2', 'changePage("scheduleEdit")', 'Edit'],
            ['screenshoot', 'img/ui/zoom', 'window.makeScreenshot("#schedule .pageContent")', 'Screenshot'],
        ],
        subcategories: ['all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        subcategoryActive: 'all',
        subpages: [
            'scheduleEdit',
            'lessonInfo',
        ],
        subpagesmode: 'modal',
    },
    {
        id: 'scheduleEdit',
        title: 'Schedule Edit',
        icon: 'img/ui/notebook.svg',
        leftBtn: 'back',
        btns: [
            ['add', 'img/ui/add2', 'window.scheduleEditor?.addLessonToSelectedDay()', 'Add lesson'],
            ['edit', 'img/ui/edit2', 'changePage("scheduleEdit")', 'Edit'],
        ],
        noBottom: true,
        noLeft: true,
    },
    {
        id: 'lessons',
        title: 'Lessons',
        icon: 'img/ui/notebook.svg',
        btns: [
            ['search'],
            ['add', 'img/ui/add2', 'window.lessonInfoPage?.createLesson()', 'Add lesson'],
            ['screenshoot', 'img/ui/zoom', 'window.makeScreenshot("#lessons .pageContent")', 'Screenshot'],
        ],
        subpages: [
            'lessonInfo',
        ],
    },
    {
        id: 'lessonInfo',
        title: 'Lesson',
        icon: 'img/ui/notebook.svg',
        leftBtn: 'back',
        // active: true,
        btns: [
            ['edit', 'img/ui/edit2', 'window.lessonInfoPage.toggleEdit()', 'Edit'],
            ['delete', 'img/ui/cross', 'window.lessonInfoPage.deleteLesson()', 'Delete']
        ],
        noBottom: true,
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
        weather: {
            location: [null, null],
            unit: "C",
            background: false,
            pageBackground: false,
        },
        clock: {
            clockFormat: "24",
            showSeconds: false,
            showDate: true,
            dateFormat: "DDMMYYYY",
            timeZone: "local",
            showDayOfWeek: true,
            leadingZero: true,
            amPm: false,
            showYear: true,
            monthAsText: false,
            dateSeparator: "/",
            jucheCalendar: false,
        },
        updates: {
            autoCheck: true,
            lastCheckedAt: null,
        },
        schedule: {
            bellSchemas: {
                "test": [
                    ["08:30", "09:10"],
                    ["09:20", "10:00"],
                    ["10:15", "10:55"],
                    ["11:15", "11:55"],
                    ["12:10", "12:50"],
                    ["13:00", "13:40"],
                    ["13:50", "14:30"],
                ],
            },
            daySchemas: [
                "test",
                "test",
                "test",
                "test",
                "test",
                "test",
                "none",
            ],
            lessons: {
            },
            daySchedules: [
                [],
                [],
                [],
                [],
                [],
                [],
                [],
            ]
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
        clock: {
            title: "Clock",
            items: [
                {
                    type: "select",
                    key: "clockFormat",
                    label: "Clock Format",
                    options: { "12": "12-hour", "24": "24-hour" }
                },
                { type: "toggle", key: "showSeconds", label: "Show Seconds" },
                { type: "toggle", key: "showDate", label: "Show Date" }
            ]
        },
        weather: {
            title: "Weather",
            items: [
                { type: "text", key: "latitude", label: "Latitude", placeholder: "47.0105" },
                { type: "text", key: "longitude", label: "Longitude", placeholder: "28.8638" },
                { type: "toggle", key: "background", label: "Weather Background" },
                { type: "toggle", key: "pageBackground", label: "Page Background" }
            ]
        },
    },
    onChange: (settings) => {
        window.weatherManager?.refresh();
    }
}
