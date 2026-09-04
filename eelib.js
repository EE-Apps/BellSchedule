if (!window.eelib) window.eelib = {}
window.eelib.pages = [
    {
        id: 'now',
        title: 'Now',
        description: 'До перемены в 15 мин',
        icon: 'img/ui/home.svg',
        active: true,
        btns: [
            ['edit', 'img/ui/edit2', 'test()', 'Edit'],
            ['aod',  'img/ui/zoom',  'test()', 'Simple'],
        ],
        subpages: [
            'lessonInfo',
        ],
        subpagesmode: 'modal',
    },
    {
        id: 'schedule',
        title: 'Schedule',
        icon: 'img/ui/notebook.svg',
        btns: [
            ['search'],
            ['edit', 'img/ui/edit2', 'changePage("scheduleEdit")', 'Edit'],
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
        ],
        noBottom: true,
        noLeft: true,
    },
    {
        id: 'about',
        title: 'About',
        icon: 'img/ui/user.svg',
        noBottom: true,
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
            lang: navigator.language.split('-')[0] || 'en'
        },
        weather: {
            town: '',
            location: [0, 0],
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
                { type: "toggle", key: "background", label: "Weather Background" },
                { type: "toggle", key: "pageBackground", label: "Page Background" }
            ]
        },
    },
    onChange: (settings) => {
        // Вызывается при любом изменении настроек
        if (typeof updateTimeDisplay === 'function') {
        updateTimeDisplay();
        }
    }
}
