// js/schedule/scheduleNow.js

class scheduleNow {
    constructor() {
        this.nextLessonsContainer = document.getElementById('nextLessons')
        this.headerEl = document.querySelector('#nextLessonsNowCard b')
        this.mode = null // 'next' | 'today' | 'tomorrow'

        this.init()
    }

    init() {
        this.addListeners()
    }

    addListeners() {
        const container = document.getElementById('nextLessonsNowCard')
        document.getElementById('collapseDoneLessons').addEventListener('click', () => {
            container.classList.toggle('collapsedDoneLessons')
        })
    }

    renderList({ lessons, bells }) {
        this.nextLessonsContainer.innerHTML = ''
        lessons.forEach((lesson, i) => {
            const card = window.scheduleCore.createLessonCard(lesson, bells[i])
            this.nextLessonsContainer.appendChild(card)
        })
    }

    // mode: 'next'     — обычный режим, показываем оставшиеся уроки сегодня
    //       'today'    — уроки сегодня ещё не начались
    //       'tomorrow' — уроки на сегодня закончились (или сегодня выходной)
    setMode(mode) {
        if (this.mode === mode) return
        this.mode = mode

        if (mode === 'tomorrow') {
            this.headerEl.textContent = window.translator.translate('tomorrow')
            this.renderList(window.scheduleCore.getTomorrow())
        } else if (mode === 'today') {
            this.headerEl.textContent = window.translator.translate('today')
            this.renderList(window.scheduleCore.today)
        } else {
            this.headerEl.textContent = window.translator.translate('next')
            this.renderList(window.scheduleCore.today)
        }
    }

    updateNextLessons() {
        if (this.mode === 'tomorrow') return // расписание на завтра прошедшими/текущими не подсвечиваем

        const bells = window.scheduleCore.today.bells
        const ct = window.timeMgr.currentTime.getTime()

        this.nextLessonsContainer.querySelectorAll('.lessonCardContainer').forEach((el, i) => {
            const lessonStartDate = window.timeMgr.stringToTime(bells[i][0])
            const lessonEndDate = window.timeMgr.stringToTime(bells[i][1])

            if (lessonStartDate < ct && lessonEndDate > ct) {
                el.classList.add('currentLesson')
                el.classList.remove('doneLesson')
            } else if (ct > lessonStartDate) {
                el.classList.remove('currentLesson')
                el.classList.add('doneLesson')
            } else {
                el.classList.remove('currentLesson')
                el.classList.remove('doneLesson')
            }
        })
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleNow = new scheduleNow
    window.scheduleNow.setMode('next')
})