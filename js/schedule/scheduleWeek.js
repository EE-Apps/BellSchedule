class scheduleWeek {
    constructor() {
        this.schedulePageContainer = document.querySelector('#schedule .pageContent')
    }

    init() {
        this.renderWeek()
        this.eventListeners()
    }

    eventListeners() {
        document.querySelectorAll('#schedule .btnsList button').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                this.filterSchedule(i == 0 ? [0, 1, 2, 3, 4, 5, 6] : [i - 1])
            })
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
        const mondayDate = window.timeMgr.current.date - window.timeMgr.current.day + 1
        console.log(mondayDate)
        settingsManager.get(`schedule.daySchedules`).forEach((daySchedule, i) => {
            if (!daySchedule || !daySchedule.length > 0) return
            const isToday = i + 1 == window.timeMgr.current.day
            const bells = (settingsManager.get('schedule.bellSchemas'))[(settingsManager.get(`schedule.daySchemas`))[i]]

            const dayDiv = document.createElement('div')
            dayDiv.className = 'scheduleDayDiv'
            if (isToday) dayDiv.classList.add("today")
            const dayH = document.createElement('h2')
            dayH.className = 'scheduleDayTitle'
            dayH.textContent = `${window.translator.translate('day' + i)}  -  ${isToday ? translator.translate('today') : (mondayDate + i) + '.' + (timeMgr.current.month)}`
            const dayContainer = document.createElement('div')
            dayContainer.className = 'scheduleContainer'

            dayDiv.appendChild(dayH)
            dayDiv.appendChild(dayContainer)

            daySchedule.forEach((lesson, i) => {
                const cardContainer = document.createElement('div')
                const card = document.createElement('div')
                cardContainer.className = 'lessonCardContainer'
                card.className = 'lessonCard'
                const lessonData = settingsManager.get(`schedule.lessons.${lesson}`)
                const lessonTime = bells[i].join(" - ")
                card.innerHTML = `
                    <div class="lessonLeft">
                        <b class="lessonName">${lessonData.name}</b>
                        <p class="lessonTime">${lessonTime}</p>
                    </div>
                    <div class="lessonRight">
                        <p>${lessonData.place}</p>
                        <p>${lessonData.teacher}</p>
                    </div>`
                
                card.addEventListener('click', () => {
                    lessonInfoPage.lesson = lesson
                    lessonInfoPage.renderLesson()
                    window.changePage('lessonInfo')
                })

                cardContainer.appendChild(card)
                dayContainer.appendChild(cardContainer)
            })
            this.schedulePageContainer.appendChild(dayDiv)
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleWeek = new scheduleWeek
    window.scheduleWeek.init()
})