class settingCard {
    constructor(id, type, title, description, settings) {
        this.id = id
        this.type = type
        this.params = settings
        this.fixType()
        this.value = this.params?.default ?? (this.type === 'range' ? (this.params?.min ?? 0) : false)

        this.el = document.createElement('div')
        this.el.className = 'card settingCard'
        this.el.id = id

        this.texts = document.createElement('div')
        this.texts.className = 'cardTextArea'
        this.el.appendChild(this.texts)
        if (title) {
            this.title = document.createElement('h3')
            this.title.className = 'setitngCardTitle'
            this.title.textContent = title
            this.texts.appendChild(this.title)
        }

        if (description) {
            this.description = document.createElement('h4')
            this.description.className = 'setitngCardDescription'
            this.description.textContent = description
            this.texts.appendChild(this.description)
        }

        if (this.params?.noShowValue !== true) {
            this.valueShow = document.createElement('h4')
            this.valueShow.className = 'setitngCardDescription valueShow'
            this.valueShow.textContent = this.value
            this.texts.appendChild(this.valueShow)
        }

        this.buttons = document.createElement('div')
        this.el.appendChild(this.buttons)

        this.createInput()

        this.useAdditionalParams()
    }

    update() {}

    fixType() {
        switch (this.type) {
            case "slider":
                this.type = 'range'
                break
            default:
                
        }
    }

    createInput() {
        const columnInputTypes = ['range', 'text', 'textarea']
        const fullPoinersTypes = ['switch']

        if (columnInputTypes.includes(this.type) || this.params?.showModal === true) this.el.classList.add('column')
        else this.el.classList.add('row')
        
        if (fullPoinersTypes.includes(this.type) || this.params?.splited !== true) this.el.classList.add('fullMouse')
        
        let input, updateSwitchState

        switch (this.type) {
            case "range": 
                this.input = document.createElement('input')
                this.input.type = 'range'
                
                // Установка атрибутов (исправлено!)
                if (this.params?.min !== undefined) this.input.min = this.params.min
                if (this.params?.max !== undefined) this.input.max = this.params.max
                if (this.params?.step !== undefined) this.input.step = this.params.step
                
                // Устанавливаем дефолтное значение для инпута
                if (this.params?.default !== undefined) {
                    this.input.value = this.params.default
                } else if (this.params?.min !== undefined) {
                    this.input.value = this.params.min
                }
                
                this.value = this.input.value
                if (this.valueShow) this.valueShow.textContent = this.value

                this.input.addEventListener('input', e => {
                    this.value = e.target.value
                    if (this.valueShow) {
                        this.valueShow.textContent = this.value
                    }
                })

                this.buttons.appendChild(this.input)
                break

            case "text":
            case "textarea":
                this.input = document.createElement(this.type === 'textarea' ? 'textarea' : 'input')
                if (this.type === 'text') this.input.type = 'text'
                if (this.params?.placeholder) this.input.placeholder = this.params.placeholder
                if (this.params?.maxLength !== undefined) this.input.maxLength = this.params.maxLength
                if (this.type === 'textarea') this.input.rows = this.params?.rows ?? 4
                this.input.value = this.params?.default ?? ''
                this.value = this.input.value
                this.input.addEventListener('input', e => {
                    this.value = e.target.value
                })
                this.buttons.appendChild(this.input)
                break

            case "switch":
                this.div = document.createElement('label')
                this.div.className = 'switcht'
                this.div.innerHTML = `
                    <input type="checkbox" ${this.value ? "checked" : ""}>
                    <span class="slider"></span>
                `
                input = this.div.querySelector("input")

                updateSwitchState = (isChecked) => {
                    this.value = isChecked
                    if (this.valueShow) {
                        this.valueShow.textContent = isChecked ? 'On' : 'Off'
                        this.valueShow.style.color = isChecked ? 'var(--ac-text)' : ''
                    }
                }

                updateSwitchState(input.checked);

                input.addEventListener("change", e => {
                    updateSwitchState(e.target.checked)
                })
                
                this.buttons.appendChild(this.div)

                this.el.addEventListener('click', (e) => {
                    if (e.target === input || input.disabled) return
                    input.checked = !input.checked
                    updateSwitchState(input.checked)
                    input.dispatchEvent(new Event('change', {bubbles: true}))
                })

                break
            case "checkbox":
                this.div = document.createElement('div')
                this.div.className = 'checkboxt'
                this.div.innerHTML = `
                    <input type="checkbox" class="${this.params?.grouped ? 'grouped' : ''}" ${this.value ? "checked" : ""}>
                `
                input = this.div.querySelector("input")

                updateSwitchState = (isChecked) => {
                    this.value = isChecked
                    if (this.valueShow) {
                        this.valueShow.textContent = isChecked ? 'On' : 'Off'
                        this.valueShow.style.color = isChecked ? 'var(--ac-text)' : ''
                    }
                }

                updateSwitchState(input.checked);

                input.addEventListener("change", e => {
                    updateSwitchState(e.target.checked)
                })
                
                this.buttons.appendChild(this.div)

                this.el.addEventListener('click', (e) => {
                    if (e.target === input) return
                    input.checked = !input.checked
                    updateSwitchState(input.checked)
                    input.dispatchEvent(new Event('change', {bubbles: true}))
                })

                break
            case "radio":
                this.div = document.createElement('div')
                this.div.className = 'radiot'
                this.div.innerHTML = `
                    <input type="radio" name="${this.params.name ?? ''}" ${this.value ? "checked" : ""}>
                `
                input = this.div.querySelector("input")

                updateSwitchState = (isChecked) => {
                    this.value = isChecked
                    if (this.valueShow) {
                        this.valueShow.textContent = isChecked ? 'On' : 'Off'
                        this.valueShow.style.color = isChecked ? 'var(--ac-text)' : ''
                    }
                }

                updateSwitchState(input.checked);

                input.addEventListener("change", e => {
                    updateSwitchState(e.target.checked)
                })
                
                this.buttons.appendChild(this.div)

                this.el.addEventListener('click', (e) => {
                    if (e.target === input || input.disabled) return
                    input.checked = true
                    updateSwitchState(input.checked)
                    input.dispatchEvent(new Event('change', {bubbles: true}))
                })

                break
            default:
                console.log('Unknown type')
        }
    }

    useAdditionalParams() {
        if (!this.params) return

        if (this.params.reversed) this.el.classList.add('reversed')

        if (this.params.noText) this.el.classList.add('rounded', 'noText')
    }

    setValue(value) {
        this.value = value
        if (this.input) {
            this.input.value = value
            if (this.valueShow) this.valueShow.textContent = value
        }
    }

    returnEl() {
        return this.el
    }
}

class settingsCardsMgr {
    constructor() {

    }

    createCard(id, type, title, description) {

    }

    createGroup(id, title, description, params) {
        const el = document.createElement('div')
        el.className = 'settingCardsGroup ' + params?.class?? ''
        el.id = id?? ''

        if (title) {
            const titleEl = document.createElement('h2')
            titleEl.textContent = title
            titleEl.className = 'settingsCardsGroupTitle'
            el.appendChild(titleEl)
        }

        if (description) {
            const descriptionEl = document.createElement('p')
            descriptionEl.textContent = description
            descriptionEl.className = 'settingsCardsGroupDescription'
            el.appendChild(descriptionEl)
        }

        return(el)
    }
}

window.settingCard = settingCard
window.settingsCardsMgr = new settingsCardsMgr

if (document.location.href === 'http://127.0.0.1:5501/blank.html' || 
    document.location.href === 'http://192.168.100.18:5501/blank.html') {
    
    const group4 = window.settingsCardsMgr.createGroup('hitest', 'Radio', 'Выбор одного', {class: 'dense'})
    const group3 = window.settingsCardsMgr.createGroup('hitest', 'Checkbox', 'Выбор нескольких', {class: 'dense'})
    const group2 = window.settingsCardsMgr.createGroup('hitest', 'Включатели', 'Тык на переключатели', {class: 'dense'})
    const group = window.settingsCardsMgr.createGroup(false, 'Всякое', 'Кучу всяких карточек накидал - потом может разсортирую')
    document.querySelector('#demo .pageContent').prepend(group)
    document.querySelector('#demo .pageContent').prepend(group2)
    document.querySelector('#demo .pageContent').prepend(group3)
    document.querySelector('#demo .pageContent').prepend(group4)

    document.querySelector('#demo .pageContent').prepend((new settingCard('teste2', 'switch', false, false, {default: true, noText: true})).returnEl())
    group.appendChild((new settingCard('teste2', 'checkbox', 'Checkbox', false,      {default: true})).returnEl())
    group.appendChild((new settingCard('teste2', 'checkbox', 'Grouped',  false,      {default: true, grouped: true, reversed: true})).returnEl())
    group.appendChild((new settingCard('teste2', 'slider',   'Hello',    'world',    {min: 5, max: 10})).returnEl())
    group.appendChild((new settingCard('teste2', 'switch',   'World',    'hello',    {default: true})).returnEl())
    group.appendChild((new settingCard('teste2', 'switch',   'World',    false,      {default: true})).returnEl())

    group2.appendChild((new settingCard('teste2', 'switch',   'Один',    false,      {default: true, reversed: true})).returnEl())
    group2.appendChild((new settingCard('teste2', 'switch',   'Два',     false,      {default: true, reversed: true})).returnEl())
    group2.appendChild((new settingCard('teste2', 'switch',   'Три',     false,      {default: true, reversed: true})).returnEl())

    group3.appendChild((new settingCard('teste2', 'checkbox', 'Один',    false,      {default: true, reversed: true, grouped: true})).returnEl())
    group3.appendChild((new settingCard('teste2', 'checkbox', 'Два',     false,      {default: true, reversed: true, grouped: true})).returnEl())
    group3.appendChild((new settingCard('teste2', 'checkbox', 'Три',     false,      {default: true, reversed: true, grouped: true})).returnEl())

    group4.appendChild((new settingCard('teste2', 'radio',    'Один',    false,      {default: true, reversed: true, name: 'group3'})).returnEl())
    group4.appendChild((new settingCard('teste2', 'radio',    'Два',     false,      {default: true, reversed: true, name: 'group3'})).returnEl())
    group4.appendChild((new settingCard('teste2', 'radio',    'Три',     false,      {default: true, reversed: true, name: 'group3'})).returnEl())
}
