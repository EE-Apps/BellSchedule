// js/schedule/scheduleCore.js

class scheduleCore {
    constructor() {
        window.timeMgr.getCurrentTime()

        this.today = this.getDaySchedule(window.timeMgr.current.day)
    }

    // weekdayIndex: 0 = понедельник ... 6 = воскресенье
    getDaySchedule(weekdayIndex) {
        const lessons = settingsManager.get('schedule.daySchedules')[weekdayIndex] || []
        const schemaName = settingsManager.get('schedule.daySchemas')[weekdayIndex]
        // Звонки без назначенного урока не должны запускать таймер как учебный день.
        const bells = (settingsManager.get('schedule.bellSchemas')[schemaName] || []).slice(0, lessons.length)
        return { lessons, bells }
    }

    refresh() {
        window.timeMgr?.getCurrentTime()
        this.today = this.getDaySchedule(window.timeMgr.current.day)
    }

    getTomorrow() {
        return this.getDaySchedule((window.timeMgr.current.day + 1) % 7)
    }

    // Общая карточка урока — используется и на странице "Сейчас", и в расписании на неделю
    createLessonCard(lessonKey, bells) {
        const lessonData = settingsManager.get(`schedule.lessons.${lessonKey}`)

        const cardContainer = document.createElement('div')
        cardContainer.className = 'lessonCardContainer'

        const card = document.createElement('div')
        card.className = 'lessonCard'

        const left = document.createElement('div')
        left.className = 'lessonLeft'
        const name = document.createElement('b')
        name.className = 'lessonName'
        name.textContent = lessonData?.name ?? lessonKey
        const time = document.createElement('p')
        time.className = 'lessonTime'
        time.textContent = bells ? bells.join(' - ') : ''
        left.append(name, time)

        const right = document.createElement('div')
        right.className = 'lessonRight'
        const place = document.createElement('p')
        place.textContent = lessonData?.place ?? ''
        const teacher = document.createElement('p')
        teacher.textContent = lessonData?.teacher ?? ''
        const teacherArr = (lessonData?.teacher ?? '').split(' ')
        if(teacherArr.length === 3) teacher.textContent = teacherArr[0][0] + '. ' + teacherArr[1][0] + '. ' + teacherArr[2]
        right.append(place, teacher)

        card.append(left, right)
        cardContainer.appendChild(card)

        card.addEventListener('click', () => {
            window.lessonInfoPage.lesson = lessonKey
            window.lessonInfoPage.renderLesson()
            window.changePage('lessonInfo', lessonKey)
        })

        return cardContainer
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleCore = new scheduleCore
    window.appScheduleChanged = () => {
        window.scheduleCore.refresh()
        window.scheduleWeek?.renderWeek()
        window.lessonsPage?.renderLessonsList()
        window.scheduleNow && (window.scheduleNow.mode = null)
        window.timeMgr?.updateTimer()
    }
})
