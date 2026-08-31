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
            schedule: document.getElementById('lessonInfoSchedule'),
        }

        this.init()
    }

    init() {
        this.lesson = 'алг'
        this.renderLesson()
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
                            <b class="lessonName ${dayN == window.timeMgr.current.day - 1 ? 'today' : ''}">${translator.translate('day' + dayN)}</b>
                            <p class="lessonTime">Урок</p>
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