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
            ['add'],
            ['edit', 'img/ui/edit2', 'changePage("scheduleEdit")', 'Edit'],
        ],
        subcategories: ['all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        subcategoryActive: 'all',
        subpages: [
            'scheduleEdit',
        ],
        subpagesmode: 'modal',
    },
    {
        id: 'scheduleEdit',
        title: 'Schedule Edit',
        icon: 'img/ui/notebook.svg',
        leftBtn: 'back',
        btns: [
            ['add'],
            ['edit', 'img/ui/edit2', 'changePage("scheduleEdit")', 'Edit'],
        ],
        noBottom: true,
        noLeft: true,
    },
    {
        id: 'lessons',
        title: 'Lessons',
        icon: 'img/ui/notebook.svg',
        leftBtn: 'back',
        btns: [
            ['search'],
            ['add'],
            ['edit', 'img/ui/edit2', 'changePage("lessonsEdit")', 'Edit'],
        ],
        noBottom: true,
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
        id: 'settings',
        title: 'Настройки',
        icon: 'img/ui/settings.svg',
        noBottom: false,
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
        schedule: {
            bellSchemas: {
                "monday": [
                    ["08:30", "09:10"],
                    ["09:20", "10:00"],
                    ["10:15", "10:55"],
                    ["11:15", "11:55"],
                    ["12:10", "12:50"],
                    ["13:00", "13:40"],
                    ["13:50", "14:30"],
                ],
                "saturday": [
                    ["08:30", "09:10"],
                    ["09:20", "10:00"],
                    ["10:10", "10:50"],
                    ["11:00", "11:40"],
                    ["11:50", "12:30"],
                    ["12:40", "13:20"],
                ],
            },
            daySchemas: [
                "monday",
                "monday",
                "monday",
                "monday",
                "monday",
                "saturday",
                "none",
            ],
            lessons: {
                укр: {
                    name: "Украинский",
                    place: "кб А214",
                    teacher: "О.В. Кравченко",
                },
                англ: {
                    name: "Английский",
                    place: "кб Б118",
                    teacher: "Е.С. Морозова",
                },
                рус: {
                    name: "Русский",
                    place: "кб А305",
                    teacher: "Т.Н. Шевченко",
                },
                физ: {
                    name: "Физика",
                    place: "кб Б243",
                    teacher: "Д.М. Коваленко",
                },
                физбп: {
                    name: "Физика БП",
                    place: "кб Б243",
                    teacher: "Д.М. Коваленко",
                },
                алг: {
                    name: "Алгебра",
                    place: "кб А389",
                    teacher: "А.И. Бондаренко",
                },
                лит: {
                    name: "Литература",
                    place: "кб Б102",
                    teacher: "М.А. Соколова",
                },
                инф: {
                    name: "Информатика",
                    place: "кб А312",
                    teacher: "В.П. Мельник",
                },
                био: {
                    name: "Биология",
                    place: "кб Б275",
                    teacher: "Н.Г. Василенко",
                },
                проект: {
                    name: "Индивидуальный Проект",
                    place: "кб А154",
                    teacher: "С.Ю. Кузнецов",
                },
                нвп: {
                    name: "НВП",
                    place: "кб Б391",
                    teacher: "Р.О. Бойко",
                },
                геогр: {
                    name: "География",
                    place: "кб А220",
                    teacher: "И.В. Воробьев",
                },
                грал: {
                    name: "Алгебра ГМРУ",
                    place: "кб Б167",
                    teacher: "А.И. Бондаренко",
                },
                клчас: {
                    name: "Классный час",
                    place: "кб А109",
                    teacher: "Е.А. Пономаренко",
                },
                ист: {
                    name: "История",
                    place: "кб Б334",
                    teacher: "Ю.Н. Лысенко",
                },
                гео: {
                    name: "Геометрия",
                    place: "кб А389",
                    teacher: "А.И. Бондаренко",
                },
                истпмр: {
                    name: "История ПМР",
                    place: "кб Б334",
                    teacher: "Ю.Н. Лысенко",
                },
                хим: {
                    name: "Химия",
                    place: "кб А281",
                    teacher: "О.М. Ткаченко",
                },
                общ: {
                    name: "Обществознание",
                    place: "кб Б334",
                    teacher: "Ю.Н. Лысенко",
                },
                физра: {
                    name: "Физкультура",
                    place: "кб А140",
                    teacher: "Г.В. Сидоренко",
                },
            },
            daySchedules: [
                [
                    "укр",
                    "био",
                    "лит",
                    "лит",
                    "проект",
                    "нвп",
                    "нвп",
                ],
                [
                    "геогр",
                    "физ",
                    "физ",
                    "грал",
                    "инф",
                    "инф",
                    "клчас",
                ],
                [
                    "алг",
                    "алг",
                    "ист",
                    "ист",
                    "гео",
                    "гео",
                ],
                [
                    "англ",
                    "англ",
                    "физ",
                    "физ",
                    "рус",
                    "рус",
                ],
                [
                    "алг",
                    "алг",
                    "лит",
                    "физ",
                    "инф",
                    "инф",
                    "физбп",
                ],
                [
                    "истпмр",
                    "хим",
                    "общ",
                    "общ",
                    "физра",
                    "физра",
                ],
                [
                ],
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