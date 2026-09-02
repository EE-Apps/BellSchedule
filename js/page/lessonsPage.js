// js/page/lessonsPage.js

class lessonsPage {
    constructor() {
        this.lessonsListContainer = document.getElementById('lessonsList')

        this.init()
    }

    init() {
        this.renderLessonsList()
    }

    renderLessonsList() {
        this.lessonsListContainer.innerHTML = ''
        const allLessons = Object.entries(window.settings.schedule.lessons)
        allLessons.sort(([k1, a], [k2, b]) => a.name.localeCompare(b.name));
        allLessons.forEach(([key, lesson]) => {
            const card = document.createElement('div')
            card.className = 'lessonCard inLessonsPage'

            const lessonName = document.createElement('b')
            const lessonTeacher = document.createElement('p')
            const lessonPlace = document.createElement('p')
            const lessonDays = document.createElement('div')

            lessonName.textContent = lesson.name
            lessonTeacher.textContent = lesson.teacher
            lessonPlace.textContent = lesson.place

            window.settings.schedule.daySchedules.forEach((dayLessons, dayN) => {
                if (dayLessons.includes(key)) {
                    const dayEl = document.createElement('div')
                    dayEl.textContent = translator.translate('dayCode' + dayN)
                    if (timeMgr.current.day - 1 == dayN) dayEl.className = 'today'
                    lessonDays.appendChild(dayEl)
                }
            })

            lessonName.className = 'lessonName'
            lessonDays.className = 'lessonDays'

            card.appendChild(lessonName)
            card.appendChild(lessonTeacher)
            card.appendChild(lessonDays)
            card.appendChild(lessonPlace)

            card.addEventListener('click', () => {
                window.lessonInfoPage.lesson = key
                window.lessonInfoPage.renderLesson()
                window.changePage('lessonInfo', key)
            })

            this.lessonsListContainer.appendChild(card)
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lessonsPage = new lessonsPage()
})