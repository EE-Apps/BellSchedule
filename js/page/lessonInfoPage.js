// js/page/lessonInfoPage.js

class lessonInfoPage {
    constructor() {
        this.lesson = ''
        this.els = {
            container: document.getElementById('lessonInfoContainer'),
            teacherH: document.getElementById('lessonInfoTeacherH'),
            teacherText: document.getElementById('lessonInfoTeacherText'),
            teacherInput: document.getElementById('lessonInfoTeacherInput'),
            placeH: document.getElementById('lessonInfoPlaceH'),
            placeText: document.getElementById('lessonInfoPlaceText'),
            placeInput: document.getElementById('lessonInfoPlaceInput'),
            pageHeader: document.querySelector('#lessonInfo .page-header h1'),
            pageHeaderInput: document.getElementById('lessonInfoNameInput'),
            pageIdInput: document.getElementById('lessonInfoIdInput'),
            schedule: document.getElementById('lessonInfoSchedule'),
        }

        this.init()
    }

    init() {
        this.lesson = Object.keys(window.settings.schedule.lessons)[0] ?? ''
        this.renderLesson()
        this.eventListeners()
    }

    eventListeners() {
        this.els.teacherInput.addEventListener('change', () => {
            window.settingsManager.set(`schedule.lessons.${this.lesson}.teacher`, this.els.teacherInput.value)
        })
        this.els.placeInput.addEventListener('change', () => {
            window.settingsManager.set(`schedule.lessons.${this.lesson}.place`, this.els.placeInput.value)
        })
        this.els.pageHeaderInput.addEventListener('change', () => {
            window.settingsManager.set(`schedule.lessons.${this.lesson}.name`, this.els.pageHeaderInput.value)
        })
        this.els.pageIdInput.addEventListener('change', () => {
            const oldKey = this.lesson
            const newKey = this.els.pageIdInput.value
            window.settingsManager.set(`schedule.lessons.${newKey}`, window.settingsManager.get(`schedule.lessons.${oldKey}`))
            window.settingsManager.del(`schedule.lessons.${oldKey}`)

            window.settings.schedule.daySchedules.forEach(day => {
                day.forEach((lessonKey, idx) => {
                    if (lessonKey === oldKey) day[idx] = newKey
                })
            })
            window.settingsManager.set('schedule.daySchedules', window.settings.schedule.daySchedules)

            this.lesson = newKey
            this.renderLesson()
            window.changePage('lessonInfo', newKey)
        })
    }

    toggleEdit(mode) {
        if (mode == 'edit' && !this.els.container.classList.contains('edit')) this.els.container.classList.add('edit')
        else if (mode == 'view') this.els.container.classList.remove('edit')
        else this.els.container.classList.toggle('edit')
    }

    renderLesson() {
        const lessonData = settings.schedule.lessons[this.lesson]

        this.els.teacherH.textContent = translator.translate('teacher')
        this.els.placeH.textContent = translator.translate('place')

        this.els.pageHeader.textContent = lessonData.name
        this.els.teacherText.textContent = lessonData.teacher
        this.els.placeText.textContent = lessonData.place

        this.els.teacherInput.value = lessonData.teacher
        this.els.placeInput.value = lessonData.place

        this.els.schedule.innerHTML = ''
        window.settings.schedule.daySchedules.forEach((dayLessons, dayN) => {
            dayLessons.forEach((dayLesson, dayLessonN) => {
                if (dayLesson == this.lesson) {
                    const [timeStart, timeEnd] = window.settings.schedule.bellSchemas[window.settings.schedule.daySchemas[dayN]][dayLessonN]

                    const el = document.createElement('div')
                    el.className = 'lessonCard inLessonInfoPage'
                    el.innerHTML = `
                        <div class="lessonLeft">
                            <b class="lessonName ${dayN == window.timeMgr.current.day ? 'today' : ''}">${translator.translate('day' + dayN)}</b>
                            <p class="lessonTime">${translator.translate('lesson')}</p>
                        </div>
                        <div class="lessonRight">
                            <p>${timeStart}</p>
                            <p>${timeEnd}</p>
                        </div>
                        `

                    this.els.schedule.appendChild(el)
                }
            })
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.lessonInfoPage = new lessonInfoPage()
})