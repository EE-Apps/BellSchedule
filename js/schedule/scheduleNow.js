class scheduleNow {
    constructor() {
        this.nextLessonsContainer = document.getElementById('nextLessons')

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

    renderNextLessons() {
        this.nextLessonsContainer.innerHTML = ''
        window.scheduleCore.today.lessons.forEach((lesson, i) => {
            const cardContainer = document.createElement('div')
            const card = document.createElement('div')
            cardContainer.className = 'lessonCardContainer'
            card.className = 'lessonCard'
            const lessonData = settingsManager.get(`schedule.lessons.${lesson}`)
            const lessonTime = window.scheduleCore.today.bells[i].join(" - ")
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
            this.nextLessonsContainer.appendChild(cardContainer)
        });
    }

    updateNextLessons() {
        const bells = window.scheduleCore.today.bells
        const ct = window.timeMgr.currentTime
        document.getElementById('nextLessons').querySelectorAll('.lessonCardContainer').forEach((el, i) => {
            const lessonStartDate = window.timeMgr.stringToTime(bells[i][0])
            const lessonEndtDate = window.timeMgr.stringToTime(bells[i][1])
            
            if (lessonStartDate < ct && lessonEndtDate > ct) {
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
    window.scheduleNow.renderNextLessons()
})