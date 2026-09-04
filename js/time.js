// js/time.js

class timeMgr {
    constructor() {
        this.currentTime
        this.current = {}
        this.els = {
            mainClock: document.querySelector('#now .page-header h1'),
            mainBreak: document.querySelector('#now .page-header h3'),
            weatherCard:        document.getElementById('weatherCard'),
            weatherTitle:       document.querySelector('#weatherCard b'),
            weatherIcon:        document.querySelector('#weatherCard #weatherIcon'),
            weatherTemperature: document.querySelector('#weatherCard #weatherTemperature'),
            weatherTime:        document.querySelector('#weatherCard #weatherDescr'),
            cardBreak:          document.querySelector('#breakCard p')
        }

        this.init()
    }

    init() {
        this.getCurrentTime()
        this.current = {
            day: this.getWeekday(),
            date: this.currentTime.getDate(),
            month: this.currentTime.getMonth(),
        }
    }

    getCurrentTime() {
        this.currentTime = new Date
        // this.currentTime.setHours(12)
        return (this.currentTime)
    }

    // 0 = понедельник ... 6 = воскресенье
    // (в отличие от Date.getDay(), где 0 = воскресенье — из-за этого расхождения
    // приложение падало по воскресеньям)
    getWeekday(date = this.currentTime) {
        return (date.getDay() + 6) % 7
    }

    stringToTime(timeString) {
        const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
        const date = new Date
        date.setHours(hours, minutes, seconds, 0)
        return (date.getTime())
    }

    getCurrentData() {
        const bells = window.scheduleCore.today.bells
        const ct = this.currentTime.getTime()
        let isLessonFound = false
        let isNextLessonFound = false

        const bellsInMs = bells.map(lesson => [
            this.stringToTime(lesson[0]),
            this.stringToTime(lesson[1])
        ])

        bellsInMs.forEach((lessonBells, i) => {
            const [start, end] = lessonBells

            if (ct >= start && ct <= end) {
                this.current.lesson = {
                    num: i,
                    start: start,
                    end: end,
                }
                this.current.isLesson = true
                this.current.nextBell = end
                isLessonFound = true
            }

            if (ct < start && (i === 0 || ct > bellsInMs[i - 1][1])) {
                isNextLessonFound = true
                this.current.nextLesson = {
                    num: i,
                    start: start,
                    end: end,
                    name: window.settings.schedule.lessons[window.scheduleCore.today.lessons[i]]?.name || window.scheduleCore.today.lessons[i] || '',
                }
            }
        })

        if (!isLessonFound) {
            this.current.isLesson = false

            const bellsFlat = bellsInMs.flat()
            const nextBellTime = bellsFlat.find(bellTime => ct < bellTime)

            this.current.nextBell = nextBellTime || null
        }

        // ещё не наступил первый урок за сегодня
        this.current.beforeFirstLesson = bellsInMs.length > 0 && ct < bellsInMs[0][0]
    }

    breakLength(currentLessonNum) {
        const bells = window.scheduleCore?.today?.bells
        const currentBell = bells?.[currentLessonNum]
        const nextBell = bells?.[currentLessonNum + 1]
        if (!currentBell || !nextBell) return 0
        return Math.round((this.stringToTime(nextBell[0]) - this.stringToTime(currentBell[1])) / (1000 * 60))
    }

    updateWeather(when) {
        const bells = window.scheduleCore.today.bells
        this.els.weatherTitle.textContent = window.translator.translate('weather')
        if (!bells.length) {
            this.els.weatherTime.textContent = ''
            return
        }
        this.els.weatherTime.textContent = window.translator.translate('in') + ' ' + bells[bells.length - 1][1] + ' - ' + (when == 'before' ? window.translator.translate('before_lessons') : window.translator.translate('after_lessons'))
    }

    updateCurrentInfo() {
        // уроки на сегодня закончились (или сегодня их вообще нет, например выходной)
        if (!this.current.nextBell) {
            this.els.mainClock.textContent = window.translator.translate('tomorrow') + " " + window.translator.translate('day' + ((this.current.day + 1) % 7)).toLowerCase()
            this.els.mainBreak.textContent = ''
            this.els.weatherCard.classList.remove('hidden')
            this.updateWeather()
            window.scheduleNow.setMode('tomorrow')
            return
        }

        window.scheduleNow.setMode(this.current.beforeFirstLesson ? 'today' : 'next')

        const diffMs = this.current.nextBell - this.currentTime.getTime()
        const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))

        const hours = Math.floor(totalSeconds / 3600)
        const hoursString = hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''
        const minutes = Math.floor(totalSeconds / 60 % 60)
        const seconds = totalSeconds % 60

        this.els.mainClock.textContent = `${hoursString}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

        if (this.current.isLesson == true) {
            const currentLessonNum = this.current.lesson.num
            if (currentLessonNum + 1 < window.scheduleCore.today.lessons.length) {
                this.els.mainBreak.textContent = window.translator.translate('before_break_with') + this.breakLength(currentLessonNum) + ' ' + window.translator.translate('minutes')
                if (!this.els.weatherCard?.classList.contains('hidden')) this.els.weatherCard.classList.add('hidden')

                this.els.cardBreak.textContent = window.translator.translate('next') + ': ' + this.breakLength(currentLessonNum) + ' ' + window.translator.translate('minutes')
            } else {
                this.els.mainBreak.textContent = window.translator.translate('before_end_of_lessons')
                this.els.weatherCard.classList.remove('hidden')
                this.updateWeather()
            }
        } else {
            this.els.mainBreak.textContent = ''
            if (this.current.beforeFirstLesson) {
                this.els.weatherCard.classList.remove('hidden')
                this.updateWeather('before')
            } else {
                const nextLessonNum = this.current.nextLesson.num
                if (!this.els.weatherCard?.classList.contains('hidden')) this.els.weatherCard.classList.add('hidden')
                this.els.mainBreak.textContent = window.translator.translate('before') + ' ' + this.current.nextLesson?.name
                this.els.cardBreak.innerHTML =  translator.translate('now')  + ': ' + this.breakLength(nextLessonNum - 1) + ' ' + translator.translate('minutes') + '<br>' +
                                                translator.translate('next') + ': ' + this.breakLength(nextLessonNum)     + ' ' + translator.translate('minutes')
            }
        }
    }

    updateTimer() {
        this.getCurrentTime()

        this.getCurrentData()
        window.scheduleNow.updateNextLessons()
        this.updateCurrentInfo()
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.timeMgr = new timeMgr()

    setInterval(() => {
        window.timeMgr.updateTimer()
    }, 1000);
})
