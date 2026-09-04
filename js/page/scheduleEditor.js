class ScheduleEditor {
    constructor() {
        this.container = document.getElementById('scheduleEditorContent')
        this.selectedDay = 0
        this.ensureSchedule()
        this.render()
    }

    get schedule() {
        return window.settings.schedule
    }

    ensureSchedule() {
        const schedule = window.settings.schedule
        schedule.bellSchemas ||= {}
        schedule.daySchemas ||= Array(7).fill('')
        schedule.daySchedules ||= Array.from({ length: 7 }, () => [])
        while (schedule.daySchemas.length < 7) schedule.daySchemas.push('')
        while (schedule.daySchedules.length < 7) schedule.daySchedules.push([])
        if (!Object.keys(schedule.bellSchemas).length) {
            schedule.bellSchemas['Основной'] = [['08:30', '09:10']]
        }
        const firstSchema = Object.keys(schedule.bellSchemas)[0]
        schedule.daySchemas = schedule.daySchemas.map(name => schedule.bellSchemas[name] ? name : firstSchema)
    }

    save() {
        window.settingsManager.set('schedule', this.schedule)
        window.appScheduleChanged?.()
    }

    option(value, label, selected) {
        const option = document.createElement('option')
        option.value = value
        option.textContent = label
        option.selected = value === selected
        return option
    }

    button(text, className = 'aBtn sec') {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = className
        button.textContent = text
        return button
    }

    render() {
        this.ensureSchedule()
        this.container.innerHTML = ''
        this.container.append(this.renderBellSchemas(), this.renderDaySchedule())
    }

    renderBellSchemas() {
        const card = document.createElement('section')
        card.className = 'scheduleEditorCard'
        card.innerHTML = '<h2>Расписание звонков</h2><p class="scheduleEditorHint">Шаблон можно назначить любому дню. Время сохраняется сразу после изменения.</p>'

        const toolbar = document.createElement('div')
        toolbar.className = 'scheduleEditorToolbar'
        const schemaSelect = document.createElement('select')
        Object.keys(this.schedule.bellSchemas).forEach(name => schemaSelect.appendChild(this.option(name, name, name === this.schedule.daySchemas[this.selectedDay])))
        schemaSelect.addEventListener('change', () => {
            this.schedule.daySchemas[this.selectedDay] = schemaSelect.value
            this.save()
            this.render()
        })
        const label = document.createElement('label')
        label.textContent = 'Шаблон:'
        label.appendChild(schemaSelect)
        toolbar.appendChild(label)

        const nameInput = document.createElement('input')
        nameInput.type = 'text'
        nameInput.value = this.schedule.daySchemas[this.selectedDay]
        nameInput.setAttribute('aria-label', 'Название шаблона звонков')
        nameInput.addEventListener('change', () => {
            const oldName = this.schedule.daySchemas[this.selectedDay]
            const newName = nameInput.value.trim()
            if (!newName || newName === oldName || this.schedule.bellSchemas[newName]) {
                nameInput.value = oldName
                return
            }
            this.schedule.bellSchemas[newName] = this.schedule.bellSchemas[oldName]
            delete this.schedule.bellSchemas[oldName]
            this.schedule.daySchemas = this.schedule.daySchemas.map(name => name === oldName ? newName : name)
            this.save(); this.render()
        })
        toolbar.appendChild(nameInput)

        const addSchema = this.button('Новый шаблон')
        addSchema.addEventListener('click', () => {
            let number = 1
            let name = 'Новый шаблон'
            while (this.schedule.bellSchemas[name]) name = `Новый шаблон ${number++}`
            this.schedule.bellSchemas[name] = [['08:30', '09:10']]
            this.schedule.daySchemas[this.selectedDay] = name
            this.save()
            this.render()
        })
        toolbar.appendChild(addSchema)
        const deleteSchema = this.button('Удалить шаблон', 'aBtn danger')
        deleteSchema.disabled = Object.keys(this.schedule.bellSchemas).length < 2
        deleteSchema.addEventListener('click', () => {
            const current = this.schedule.daySchemas[this.selectedDay]
            const replacement = Object.keys(this.schedule.bellSchemas).find(name => name !== current)
            if (!replacement) return
            delete this.schedule.bellSchemas[current]
            this.schedule.daySchemas = this.schedule.daySchemas.map(name => name === current ? replacement : name)
            this.save(); this.render()
        })
        toolbar.appendChild(deleteSchema)
        card.appendChild(toolbar)

        const schemaName = this.schedule.daySchemas[this.selectedDay]
        const rows = document.createElement('div')
        rows.className = 'scheduleEditorRows'
        this.schedule.bellSchemas[schemaName].forEach((bell, index) => {
            const row = document.createElement('div')
            row.className = 'scheduleEditorRow'
            const number = document.createElement('span')
            number.textContent = `${index + 1}.`
            const start = document.createElement('input')
            start.type = 'time'; start.value = bell[0]
            const end = document.createElement('input')
            end.type = 'time'; end.value = bell[1]
            const update = () => {
                if (!start.value || !end.value || start.value >= end.value) {
                    row.title = 'Время окончания должно быть позже времени начала'
                    return
                }
                this.schedule.bellSchemas[schemaName][index] = [start.value, end.value]
                this.save()
            }
            start.addEventListener('change', update); end.addEventListener('change', update)
            const remove = this.button('Удалить', 'aBtn danger')
            remove.addEventListener('click', () => {
                this.schedule.bellSchemas[schemaName].splice(index, 1)
                this.save(); this.render()
            })
            row.append(number, start, document.createTextNode('—'), end, remove)
            rows.appendChild(row)
        })
        card.appendChild(rows)
        const addBell = this.button('Добавить звонок')
        addBell.addEventListener('click', () => {
            const bells = this.schedule.bellSchemas[schemaName]
            const previousEnd = bells.at(-1)?.[1] || '08:00'
            const [hours, minutes] = previousEnd.split(':').map(Number)
            const startMinutes = hours * 60 + minutes + 10
            const endMinutes = startMinutes + 40
            const formatTime = total => `${String(Math.floor((total % 1440) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
            bells.push([formatTime(startMinutes), formatTime(endMinutes)])
            this.save(); this.render()
        })
        card.appendChild(addBell)
        return card
    }

    renderDaySchedule() {
        const card = document.createElement('section')
        card.className = 'scheduleEditorCard'
        card.innerHTML = '<h2>Уроки по дням</h2>'
        const tabs = document.createElement('div')
        tabs.className = 'scheduleEditorDayTabs'
        for (let day = 0; day < 7; day++) {
            const tab = this.button(window.translator?.translate(`dayCode${day}`) || `День ${day + 1}`, 'aBtn sec')
            tab.classList.toggle('active', day === this.selectedDay)
            tab.addEventListener('click', () => { this.selectedDay = day; this.render() })
            tabs.appendChild(tab)
        }
        card.appendChild(tabs)

        const schemaLabel = document.createElement('label')
        schemaLabel.textContent = 'Расписание звонков: '
        const schemaSelect = document.createElement('select')
        Object.keys(this.schedule.bellSchemas).forEach(name => schemaSelect.appendChild(this.option(name, name, this.schedule.daySchemas[this.selectedDay])))
        schemaSelect.addEventListener('change', () => {
            this.schedule.daySchemas[this.selectedDay] = schemaSelect.value
            this.save(); this.render()
        })
        schemaLabel.appendChild(schemaSelect)
        card.appendChild(schemaLabel)

        const lessons = this.schedule.daySchedules[this.selectedDay]
        const rows = document.createElement('div')
        rows.className = 'scheduleEditorRows'
        lessons.forEach((lessonKey, index) => {
            const row = document.createElement('div')
            row.className = 'scheduleEditorRow'
            const number = document.createElement('span'); number.textContent = `${index + 1}.`
            const select = document.createElement('select')
            Object.entries(this.schedule.lessons).forEach(([key, lesson]) => select.appendChild(this.option(key, lesson.name || key, lessonKey)))
            select.addEventListener('change', () => { lessons[index] = select.value; this.save() })
            const remove = this.button('Удалить', 'aBtn danger')
            remove.addEventListener('click', () => { lessons.splice(index, 1); this.save(); this.render() })
            row.append(number, select, remove)
            rows.appendChild(row)
        })
        card.appendChild(rows)

        const hint = document.createElement('p')
        hint.className = 'scheduleEditorHint'
        const bellCount = this.schedule.bellSchemas[this.schedule.daySchemas[this.selectedDay]].length
        hint.textContent = lessons.length > bellCount ? 'Уроков больше, чем звонков: лишние уроки не попадут в таймер.' : `Уроков: ${lessons.length}; звонков в шаблоне: ${bellCount}.`
        card.appendChild(hint)

        const addLesson = this.button('Добавить урок в день')
        addLesson.disabled = !Object.keys(this.schedule.lessons).length || lessons.length >= bellCount
        addLesson.addEventListener('click', () => this.addLessonToSelectedDay())
        card.appendChild(addLesson)
        return card
    }

    addLessonToSelectedDay() {
        const keys = Object.keys(this.schedule.lessons)
        if (!keys.length) {
            window.lessonInfoPage?.createLesson()
            return
        }
        const bells = this.schedule.bellSchemas[this.schedule.daySchemas[this.selectedDay]] || []
        if (this.schedule.daySchedules[this.selectedDay].length >= bells.length) return
        this.schedule.daySchedules[this.selectedDay].push(keys[0])
        this.save(); this.render()
        window.changePage('scheduleEdit')
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.scheduleEditor = new ScheduleEditor()
})
