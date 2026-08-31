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
        }

        this.init()
    }

    init() {
        this.getCurrentTime()
        this.current = {
            day: this.currentTime.getDay(),
            date: this.currentTime.getDate(),
            month: this.currentTime.getMonth(),
        }
    }

    getCurrentTime() {
        this.currentTime = new Date
        //this.currentTime.setHours(10)
        this.currentTime.setHours(14)
        console.log(this.currentTime.toString())
        return(this.currentTime)
    }

    stringToTime(timeString) {
        const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
        const date = new Date
        date.setHours(hours, minutes, seconds, 0)
        return(date.getTime())
    }

    getCurrentData() {
        const bells = window.scheduleCore.today.bells
        const ct = this.currentTime.getTime()
        let isLessonFound = false

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
        })

        if (!isLessonFound) {
            this.current.isLesson = false
            
            const bellsFlat = bellsInMs.flat()
            
            const nextBellTime = bellsFlat.find(bellTime => ct < bellTime)
            
            this.current.nextBell = nextBellTime || null
        }
    }

    breakLength(currentLessonNum) {
        return Math.round((this.stringToTime(window.scheduleCore.today?.bells[currentLessonNum + 1][0]) - this.stringToTime(window.scheduleCore.today.bells[currentLessonNum][1])) / (1000 * 60)) || 0
    }

    updateWeather(when) {
        this.els.weatherTitle.textContent = window.translator.translate('weather')
        this.els.weatherTime.textContent = window.translator.translate('in') + ' ' + window.scheduleCore.today.bells[window.scheduleCore.today.bells.length - 1][1] + ' - ' + (when == 'before' ? window.translator.translate('before_lessons') : window.translator.translate('after_lessons'))
    }

    updateCurrentInfo() {
        if (!this.current.nextBell) {
            this.els.mainClock.textContent = window.translator.translate('tomorrow') + " " + window.translator.translate('day' + (this.current.day + 1)).toLowerCase()
            this.els.mainBreak.textContent = ''
            this.els.weatherCard.classList.remove('hidden')
            this.updateWeather()
            return
        }

        const diffMs = this.current.nextBell - this.currentTime.getTime()
        const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
        
        const hours = Math.floor(totalSeconds / 3600)
        const hoursString = hours > 0 ? `${String(hours).padStart(2, '0')}:` : ''
        const minutes = Math.floor(totalSeconds / 60 % 60)
        const seconds = totalSeconds % 60

        this.els.mainClock.textContent = `${hoursString}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        if (this.current.isLesson == true) {
            if (this.current.lesson.num + 1 < window.scheduleCore.today.lessons.length) {
                const currentLessonNum = this.current.lesson.num
                this.els.mainBreak.textContent = `До перемены в ${this.breakLength(currentLessonNum)} мин`
                if (!this.els.weatherCard?.classList.contains('hidden')) this.els.weatherCard.classList.add('hidden')
            } else {
                this.els.mainBreak.textContent = `До конца уроков`
                this.els.weatherCard.classList.remove('hidden')
                this.updateWeather()
            }
        } else {
            if (true) {
                this.els.mainBreak.textContent = ``
            } else {
                this.els.mainBreak.textContent = ``
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