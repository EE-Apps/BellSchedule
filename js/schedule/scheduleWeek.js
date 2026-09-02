// js/schedule/scheduleWeek.js

class scheduleWeek {
    constructor() {
        this.schedulePageContainer = document.querySelector('#schedule .pageContent')
    }

    init() {
        this.renderWeek()
        this.eventListeners()
        this.updateBtnsList()
    }

    eventListeners() {
        document.querySelectorAll('#schedule .btnsList button').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                this.filterSchedule(i == 0 ? [0, 1, 2, 3, 4, 5, 6] : [i - 1])
            })
        })
    }

    updateBtnsList() {
        const btnsList = document.querySelector('#schedule .page-header-btns .btnsList.topNav')
        btnsList.querySelectorAll('button').forEach((btn, i) => {
            btn.textContent = btn.textContent == 'all' ? window.translator.translate('all') : window.translator.translate('day' + (i - 1))
        })
    }

    filterSchedule(days = []) {
        const dayCards = document.querySelectorAll('.scheduleDayDiv')
        dayCards.forEach((card, i) => {
            if (days.includes(i)) card.classList.remove('hidden')
                else card.classList.add('hidden')
        })
    }

    renderWeek() {
        this.schedulePageContainer.innerHTML = ''

        // Понедельник этой недели считаем через Date, чтобы корректно
        // обрабатывался переход через границу месяца/года
        // (раньше при таком переходе на экране появлялись даты вида "32.7")
        const monday = new Date(window.timeMgr.currentTime)
        monday.setHours(0, 0, 0, 0)
        monday.setDate(monday.getDate() - window.timeMgr.current.day)

        settingsManager.get(`schedule.daySchedules`).forEach((daySchedule, i) => {
            if (!daySchedule || !(daySchedule.length > 0)) return

            const isToday = i == window.timeMgr.current.day
            const bells = (settingsManager.get('schedule.bellSchemas'))[(settingsManager.get(`schedule.daySchemas`))[i]] || []

            const dayDate = new Date(monday)
            dayDate.setDate(monday.getDate() + i)

            const dayDiv = document.createElement('div')
            dayDiv.className = 'scheduleDayDiv'
            if (isToday) dayDiv.classList.add("today")

            const dayH = document.createElement('h2')
            dayH.className = 'scheduleDayTitle'
            dayH.textContent = `${window.translator.translate('day' + i)}  -  ${isToday ? window.translator.translate('today') : String(dayDate.getDate()).padStart(2, '0') + '.' + String(dayDate.getMonth() + 1).padStart(2, '0')}`

            const dayContainer = document.createElement('div')
            dayContainer.className = 'scheduleContainer'

            dayDiv.appendChild(dayH)
            dayDiv.appendChild(dayContainer)

            daySchedule.forEach((lesson, j) => {
                const card = window.scheduleCore.createLessonCard(lesson, bells[j])
                dayContainer.appendChild(card)
            })

            this.schedulePageContainer.appendChild(dayDiv)
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleWeek = new scheduleWeek
    window.scheduleWeek.init()
})