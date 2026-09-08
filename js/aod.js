class AodPage {
    constructor() {
        this.wakeLock = null
        this.moveTimer = null
        this.moveIndex = 0
        this.els = {
            page: document.getElementById('aod'),
            screen: document.querySelector('#aod .aodScreen'),
            countdown: document.getElementById('aodCountdown'),
            after: document.getElementById('aodAfter'),
            lessonNumber: document.getElementById('aodLessonNumber'),
            breakLength: document.getElementById('aodBreakLength'),
            weather: document.getElementById('aodWeather'),
            weatherTime: document.getElementById('aodWeatherTime')
        }
        document.addEventListener('visibilitychange', () => this.syncScreenState())
        window.addEventListener('pageshow', () => this.syncScreenState())
        window.addEventListener('pagehide', () => this.releaseWakeLock())
        this.pageObserver = new MutationObserver(() => this.syncScreenState())
        this.pageObserver.observe(this.els.page, { attributes: true, attributeFilter: ['class'] })
        this.syncScreenState()
    }

    isActive() {
        return this.els.page?.classList.contains('active') && document.visibilityState === 'visible'
    }

    async requestWakeLock() {
        if (!this.isActive() || this.wakeLock || this.nativeWakeLockActive) return

        if (window.AndroidBridge?.keepScreenOn) {
            window.AndroidBridge.keepScreenOn(true)
            this.nativeWakeLockActive = true
            AndroidBridge.setFullscreen(true)
            return
        }

        if (!navigator.wakeLock?.request) return
        try {
            this.wakeLock = await navigator.wakeLock.request('screen')
            this.wakeLock.addEventListener('release', () => {
                this.wakeLock = null
                if (this.isActive()) this.requestWakeLock()
            })
        } catch (error) {
            console.warn('Не удалось заблокировать засыпание экрана:', error)
        }
    }

    releaseWakeLock() {
        if (this.nativeWakeLockActive && window.AndroidBridge?.keepScreenOn) {
            window.AndroidBridge.keepScreenOn(false)
            this.nativeWakeLockActive = false
        }
        this.wakeLock?.release().catch(() => {})
        this.wakeLock = null
    }

    startContentMovement() {
        if (this.moveTimer || !this.els.screen) return
        this.moveTimer = setInterval(() => {
            if (!this.isActive()) return
            this.moveIndex = (this.moveIndex + 1) % 8
            this.els.screen.dataset.aodPosition = String(this.moveIndex)
        }, 60 * 1000)
    }

    stopContentMovement() {
        clearInterval(this.moveTimer)
        this.moveTimer = null
        this.moveIndex = 0
        if (this.els.screen) delete this.els.screen.dataset.aodPosition
    }

    syncScreenState() {
        if (this.isActive()) {
            this.requestWakeLock()
            this.startContentMovement()
        } else {
            this.releaseWakeLock()
            this.stopContentMovement()
        }
    }

    formatDuration(totalSeconds) {
        const seconds = Math.max(0, Math.floor(totalSeconds))
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const remainder = seconds % 60
        return hours
            ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
            : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    }

    minutesBetween(start, end) {
        return Math.max(0, Math.round((end - start) / 60000))
    }

    timeOnDay(time, dayOffset = 0) {
        const date = new Date(window.timeMgr.currentTime)
        date.setDate(date.getDate() + dayOffset)
        const [hours, minutes, seconds = 0] = time.split(':').map(Number)
        date.setHours(hours, minutes, seconds, 0)
        return date.getTime()
    }

    getState() {
        const time = window.timeMgr
        const core = window.scheduleCore
        const today = core?.today
        if (!time || !today) return null

        let schedule = today
        let dayOffset = 0
        let isNextSchoolDay = false
        if (!schedule.bells?.length || !schedule.lessons?.length) {
            const nextSchoolDay = core.getNextSchoolDay?.(time.current.day)
            if (!nextSchoolDay) return null
            schedule = nextSchoolDay.schedule
            dayOffset = nextSchoolDay.offset
            isNextSchoolDay = true
        }

        const bells = schedule.bells
        const now = time.currentTime.getTime()
        const times = bells.map(([start, end]) => [this.timeOnDay(start, dayOffset), this.timeOnDay(end, dayOffset)])
        const currentIndex = times.findIndex(([start, end]) => now >= start && now <= end)
        const nextIndex = currentIndex >= 0
            ? currentIndex
            : times.findIndex(([start]) => now < start)

        if (nextIndex < 0) {
            const nextSchoolDay = core.getNextSchoolDay?.(time.current.day)
            if (!nextSchoolDay || isNextSchoolDay) return { finished: true, bells, times, schedule }
            schedule = nextSchoolDay.schedule
            dayOffset = nextSchoolDay.offset
            isNextSchoolDay = true
            return this.getStateForSchedule(schedule, dayOffset, isNextSchoolDay)
        }

        return this.getStateForSchedule(schedule, dayOffset, isNextSchoolDay, times, now)
    }

    getStateForSchedule(schedule, dayOffset, isNextSchoolDay, times = null, now = window.timeMgr.currentTime.getTime()) {
        const bells = schedule.bells
        times ||= bells.map(([start, end]) => [this.timeOnDay(start, dayOffset), this.timeOnDay(end, dayOffset)])
        const currentIndex = times.findIndex(([start, end]) => now >= start && now <= end)
        const nextIndex = currentIndex >= 0 ? currentIndex : times.findIndex(([start]) => now < start)
        if (nextIndex < 0) return { finished: true, bells, times, schedule }

        const isLesson = currentIndex >= 0
        const targetTime = isLesson ? times[currentIndex][1] : times[nextIndex][0]
        const lessonIndex = isLesson ? currentIndex : nextIndex
        const afterIndex = isLesson ? currentIndex + 1 : nextIndex
        const nextLessonName = window.settings.schedule.lessons[schedule.lessons[lessonIndex]]?.name || schedule.lessons[lessonIndex]
        let breakMinutes = 0
        if (isLesson && afterIndex < times.length) {
            breakMinutes = this.minutesBetween(times[currentIndex][1], times[afterIndex][0])
        } else if (!isLesson && nextIndex > 0) {
            breakMinutes = this.minutesBetween(times[nextIndex - 1][1], times[nextIndex][0])
        } else if (!isLesson && nextIndex === 0 && times.length > 1) {
            breakMinutes = this.minutesBetween(times[0][1], times[1][0])
        }

        return {
            bells,
            times,
            currentIndex,
            lessonIndex,
            targetTime,
            nextLessonName,
            breakMinutes,
            afterIndex,
            isLesson,
            schedule,
            dayOffset,
            isNextSchoolDay
        }
    }

    update() {
        const state = this.getState()
        if (!state) {
            this.els.countdown.textContent = '--:--'
            this.els.after.textContent = 'Расписание пока пусто.'
            this.els.lessonNumber.textContent = '—'
            this.els.breakLength.textContent = '—'
            this.els.weather.textContent = '—'
            this.els.weatherTime.textContent = '—'
            return
        }

        if (state.finished) {
            this.els.countdown.textContent = '00:00'
            this.els.after.textContent = 'Учебный день окончен'
            this.els.lessonNumber.textContent = '—'
            this.els.breakLength.textContent = '—'
            this.updateWeather()
            return
        }

        const now = window.timeMgr.currentTime.getTime()
        this.els.countdown.textContent = this.formatDuration((state.targetTime - now) / 1000)
        this.els.after.textContent = state.isLesson
            ? (state.afterIndex < state.times.length ? `После звонка: перемена ${state.breakMinutes} мин` : 'После звонка: конец занятий')
            : `После звонка: ${state.nextLessonName || 'следующий урок'}`
        this.els.lessonNumber.textContent = `№${state.lessonIndex + 1}`
        this.els.breakLength.textContent = state.breakMinutes ? `${state.breakMinutes} мин` : '—'
        this.updateWeather(state)
    }

    updateWeather(state = null) {
        const bells = state?.bells || window.scheduleCore?.today?.bells || []
        if (!bells.length || !window.weatherManager?.forecastAtTime) {
            this.els.weather.textContent = '—'
            this.els.weatherTime.textContent = 'нет данных'
            return
        }
        const end = state?.times?.[state.times.length - 1]?.[1] || window.timeMgr.stringToTime(bells[bells.length - 1][1])
        const forecast = window.weatherManager.forecastAtTime(end)
        if (!forecast) {
            this.els.weather.textContent = '—'
            this.els.weatherTime.textContent = 'нет данных'
            return
        }
        this.els.weather.textContent = `${Math.round(forecast.temperature)}°C`
        this.els.weatherTime.textContent = `в ${new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aodPage = new AodPage()
    window.aodPage.update()
    setTimeout(() => window.aodPage.update(), 100)

    document.getElementById('aodCountdown').addEventListener('click', () => {
        window.changePage('now')
        AndroidBridge.setFullscreen(false)
    })
})
