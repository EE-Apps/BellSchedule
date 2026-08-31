class scheduleCore {
    constructor() {
        window.timeMgr.getCurrentTime()


        this.today = {
            lessons: (settingsManager.get(`schedule.daySchedules`))[window.timeMgr.currentTime.getDay() - 1],
            bells: (settingsManager.get('schedule.bellSchemas'))[(settingsManager.get(`schedule.daySchemas`))[window.timeMgr.currentTime.getDay() - 1]],
        }
    }

    init() {

    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleCore = new scheduleCore
})