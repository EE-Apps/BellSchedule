class ScheduleValidator {
    static timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

    static validate(schedule) {
        const errors = []
        const schemas = schedule?.bellSchemas || {}
        const lessons = schedule?.lessons || {}
        const daySchemas = schedule?.daySchemas || []
        const daySchedules = schedule?.daySchedules || []

        if (!Array.isArray(daySchemas) || daySchemas.length !== 7) errors.push('Должно быть ровно 7 настроек дней недели.')
        if (!Array.isArray(daySchedules) || daySchedules.length !== 7) errors.push('Должно быть ровно 7 расписаний по дням.')

        Object.entries(schemas).forEach(([name, bells]) => {
            if (!Array.isArray(bells) || !bells.length) errors.push(`Шаблон «${name}» не содержит звонков.`)
            let previousEnd = ''
            ;(bells || []).forEach((bell, index) => {
                const [start, end] = Array.isArray(bell) ? bell : []
                if (!this.timePattern.test(start || '') || !this.timePattern.test(end || '')) {
                    errors.push(`Шаблон «${name}», звонок ${index + 1}: укажите время в формате ЧЧ:ММ.`)
                } else if (start >= end) {
                    errors.push(`Шаблон «${name}», звонок ${index + 1}: окончание должно быть позже начала.`)
                } else if (previousEnd && start < previousEnd) {
                    errors.push(`Шаблон «${name}»: звонки не должны пересекаться.`)
                }
                previousEnd = end || previousEnd
            })
        })

        for (let day = 0; day < 7; day++) {
            const schemaName = daySchemas[day]
            const dayLessons = daySchedules[day] || []
            const bells = schemas[schemaName]
            if (!bells) errors.push(`Для дня ${day + 1} не выбран существующий шаблон звонков.`)
            if (bells && dayLessons.length > bells.length) errors.push(`День ${day + 1}: уроков больше, чем звонков.`)
            dayLessons.forEach(key => {
                if (!lessons[key]) errors.push(`День ${day + 1}: урок «${key}» не существует.`)
            })
        }
        return errors
    }

    static notify(errors) {
        if (!errors.length) return true
        window.notification?.error('Расписание не сохранено', errors[0])
        return false
    }
}

window.ScheduleValidator = ScheduleValidator
