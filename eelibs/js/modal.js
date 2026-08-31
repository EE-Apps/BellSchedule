class ModalMgr {

createModalInput(id, labelText, type = 'text', placeholder = '', options = {}) {
    const modalBg = document.getElementById('modal') || document.createElement('div');
    modalBg.innerHTML = '';
    modalBg.id = 'modal';
    modalBg.className = 'modal active'
    const modalDiv = document.getElementById('modalForuse') || document.createElement('div');
    modalDiv.innerHTML = '';
    modalDiv.id = 'modalForuse';
    modalDiv.className = 'dialog input';
    
    let content = '';
    let additionalScripts = '';

    switch(type) {
        case 'text':
        case 'number':
        case 'password':
        case 'email':
        case 'url':
            content = `<input type="${type}" id="${id}" name="${id}" placeholder="${placeholder}" class="modal-input">`;
            break;
            
        case 'textarea':
            content = `<textarea id="${id}" name="${id}" placeholder="${placeholder}" class="modal-textarea" rows="${options.rows || 4}"></textarea>`;
            break;
            
        case 'date':
            content = createCustomDatePicker(id);
            additionalScripts = 'initDatePicker';
            break;
            
        case 'time':
            content = createCustomTimePicker(id);
            additionalScripts = 'initTimePicker';
            break;
            
        case 'datetime-local':
            content = createCustomDateTimePicker(id);
            additionalScripts = 'initDateTimePicker';
            break;
            
        case 'color':
            content = createCustomColorPicker(id, options.defaultColor || '#000000');
            additionalScripts = 'initColorPicker';
            break;
            
        case 'checkbox':
            content = `<div class="checkbox-container">
                <input type="checkbox" id="${id}" name="${id}" class="modal-checkbox">
                <label for="${id}" class="checkbox-label">${options.checkboxLabel || 'Enable'}</label>
            </div>`;
            break;
            
        case 'select':
            content = createCustomSelect(id, options.selectOptions || []);
            additionalScripts = 'initCustomSelect';
            break;
            
        case 'range':
            content = createCustomRange(id, options);
            additionalScripts = 'initCustomRange';
            break;
            
        case 'file':
            content = `<div class="file-input-container">
                <input type="file" id="${id}" name="${id}" class="modal-file-input" ${options.multiple ? 'multiple' : ''}>
                <label for="${id}" class="file-input-label">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <span class="file-text">Choose file...</span>
                </label>
            </div>`;
            additionalScripts = 'initFileInput';
            break;
            
        default:
            content = `<input type="text" id="${id}" name="${id}" placeholder="${placeholder}" class="modal-input">`;
    }

    modalDiv.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${labelText}</h3>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer">
                <button id="cancel-modal" class="btn-secondary">Cancel</button>
                <button id="submit-modal" class="btn-primary">OK</button>
            </div>
        </div>
    `;
    
    document.getElementById('content')?.classList.add('modal-open');
    modalBg.appendChild(modalDiv);
    document.body.appendChild(modalBg);
    
    // Инициализация кастомных элементов
    setTimeout(() => {
        if (additionalScripts === 'initDatePicker') initDatePicker(id);
        else if (additionalScripts === 'initTimePicker') initTimePicker(id);
        else if (additionalScripts === 'initDateTimePicker') initDateTimePicker(id);
        else if (additionalScripts === 'initColorPicker') initColorPicker(id, options.defaultColor || '#000000');
        else if (additionalScripts === 'initCustomSelect') initCustomSelect(id);
        else if (additionalScripts === 'initCustomRange') initCustomRange(id);
        else if (additionalScripts === 'initFileInput') initFileInput(id);
        
        this.setupModalEvents(modalDiv, id, type);
    }, 0);
    
    return new Promise((resolve) => {
        modalDiv.dataset.resolveCallback = resolve.toString();
    });
}

// Создание кастомного выбора даты
createCustomDatePicker(id) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    return `
        <div class="date-picker-container" id="${id}-container">
            <input type="hidden" id="${id}" name="${id}">
            <div class="date-display" id="${id}-display">
                <span class="date-value">Select date</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>
            <div class="date-picker-dropdown" id="${id}-dropdown" style="display: none;">
                <div class="date-picker-header">
                    <button class="date-nav" data-action="prev-year">‹‹</button>
                    <button class="date-nav" data-action="prev-month">‹</button>
                    <span class="date-current" id="${id}-current">${getMonthName(month)} ${year}</span>
                    <button class="date-nav" data-action="next-month">›</button>
                    <button class="date-nav" data-action="next-year">››</button>
                </div>
                <div class="date-picker-weekdays">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div class="date-picker-days" id="${id}-days"></div>
            </div>
        </div>
    `;
}

// Создание кастомного выбора времени
createCustomTimePicker(id) {
    return `
        <div class="time-picker-container" id="${id}-container">
            <input type="hidden" id="${id}" name="${id}">
            <div class="time-picker-dropdown" id="${id}-dropdown">
                <div class="time-picker-wheels">
                    <div class="time-wheel" id="${id}-hours">
                        ${generateTimeOptions(0, 23)}
                    </div>
                    <div class="time-separator">:</div>
                    <div class="time-wheel" id="${id}-minutes">
                        ${generateTimeOptions(0, 59)}
                    </div>
                </div>
            </div>
            <div class="time-picker-black"></div>
        </div>
    `;
}

// Создание кастомного выбора даты и времени
createCustomDateTimePicker(id) {
    return `
        <div class="datetime-picker-container" id="${id}-container">
            <input type="hidden" id="${id}" name="${id}">
            <div class="datetime-display" id="${id}-display">
                <span class="datetime-value">Select date & time</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            </div>
            <div class="datetime-picker-tabs" id="${id}-tabs" style="display: none;">
                <button class="datetime-tab active" data-tab="date">Date</button>
                <button class="datetime-tab" data-tab="time">Time</button>
            </div>
            <div class="datetime-picker-content" id="${id}-content" style="display: none;">
                <div class="tab-pane active" data-pane="date">
                    ${createCustomDatePicker(id + '-date').replace(id, id + '-date')}
                </div>
                <div class="tab-pane" data-pane="time">
                    ${createCustomTimePicker(id + '-time').replace(id, id + '-time')}
                </div>
            </div>
        </div>
    `;
}

// Создание кастомного выбора цвета
createCustomColorPicker(id, defaultColor) {
    const presetColors = [
        '#FF0000', '#FF6B00', '#FFD600', '#00FF00', '#00FFFF', '#0066FF', '#9900FF', '#FF00FF',
        '#800000', '#804000', '#808000', '#008000', '#008080', '#000080', '#4B0082', '#800080',
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#C9C9FF', '#E0BBE4', '#FFC9DE',
        '#000000', '#404040', '#808080', '#BFBFBF', '#FFFFFF'
    ];
    
    return `
        <div class="color-picker-container" id="${id}-container">
            <input type="hidden" id="${id}" name="${id}" value="${defaultColor}">
            <div class="color-display" id="${id}-display">
                <div class="color-preview" style="background-color: ${defaultColor};"></div>
                <span class="color-value">${defaultColor}</span>
            </div>
            <div class="color-picker-dropdown" id="${id}-dropdown" style="display: none;">
                <div class="color-preset-grid">
                    ${presetColors.map(color => `
                        <div class="color-preset-item" data-color="${color}" style="background-color: ${color};">
                            ${color === defaultColor ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="color-custom-section">
                    <label class="color-custom-label">Custom color</label>
                    <div class="color-input-group">
                        <input type="color" id="${id}-native" value="${defaultColor}" class="color-native-input">
                        <input type="text" id="${id}-hex" value="${defaultColor}" class="color-hex-input" pattern="^#[0-9A-Fa-f]{6}$" maxlength="7">
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Создание кастомного select
createCustomSelect(id, options) {
    return `
        <div class="custom-select-container" id="${id}-container">
            <input type="hidden" id="${id}" name="${id}">
            <div class="custom-select-display" id="${id}-display">
                <span class="select-value">Select an option</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div class="custom-select-dropdown" id="${id}-dropdown" style="display: none;">
                ${options.map((opt, idx) => `
                    <div class="select-option" data-value="${opt.value || opt}" data-index="${idx}">
                        ${opt.label || opt}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Создание кастомного range slider
createCustomRange(id, options = {}) {
    const min = options.min || 0;
    const max = options.max || 100;
    const step = options.step || 1;
    const value = options.value || min;
    
    return `
        <div class="range-container" id="${id}-container">
            <input type="hidden" id="${id}" name="${id}" value="${value}">
            <div class="range-display">
                <span class="range-label">${options.label || 'Value'}</span>
                <span class="range-value" id="${id}-value">${value}</span>
            </div>
            <div class="range-slider-wrapper">
                <input type="range" id="${id}-slider" min="${min}" max="${max}" step="${step}" value="${value}" class="range-slider">
                <div class="range-track">
                    <div class="range-progress" id="${id}-progress" style="width: ${((value - min) / (max - min)) * 100}%"></div>
                </div>
            </div>
            <div class="range-minmax">
                <span>${min}</span>
                <span>${max}</span>
            </div>
        </div>
    `;
}

// Вспомогательные функции
getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
}

generateTimeOptions(start, end) {
    let html = '';
    for (let i = start; i <= end; i++) {
        const value = i.toString().padStart(2, '0');
        html += `<div class="time-option" data-value="${value}">${value}</div>`;
    }
    return html;
}

// Инициализация Date Picker
initDatePicker(id) {
    const container = document.getElementById(`${id}-container`);
    const display = document.getElementById(`${id}-display`);
    const dropdown = document.getElementById(`${id}-dropdown`);
    const input = document.getElementById(id);
    
    let currentDate = new Date();
    let selectedDate = null;
    
    display.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        if (dropdown.style.display === 'block') {
            renderCalendar();
        }
    });
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        document.getElementById(`${id}-current`).textContent = `${getMonthName(month)} ${year}`;
        
        const daysContainer = document.getElementById(`${id}-days`);
        daysContainer.innerHTML = '';
        
        for (let i = 0; i < firstDay; i++) {
            daysContainer.innerHTML += '<div class="date-day empty"></div>';
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            
            daysContainer.innerHTML += `
                <div class="date-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                     data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}">
                    ${day}
                </div>
            `;
        }
        
        daysContainer.querySelectorAll('.date-day:not(.empty)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                const dateStr = dayEl.dataset.date;
                selectedDate = new Date(dateStr);
                input.value = dateStr;
                display.querySelector('.date-value').textContent = formatDate(selectedDate);
                dropdown.style.display = 'none';
            });
        });
    }
    
    dropdown.querySelectorAll('.date-nav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'prev-month') {
                currentDate.setMonth(currentDate.getMonth() - 1);
            } else if (action === 'next-month') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (action === 'prev-year') {
                currentDate.setFullYear(currentDate.getFullYear() - 1);
            } else if (action === 'next-year') {
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
            renderCalendar();
        });
    });
    
    renderCalendar();
}

// Инициализация Time Picker
initTimePicker(id) {
    const dropdown = document.getElementById(`${id}-dropdown`);
    const input = document.getElementById(id);
    const hoursWheel = document.getElementById(`${id}-hours`);
    const minutesWheel = document.getElementById(`${id}-minutes`);
    
    let selectedHour = 12;
    let selectedMinute = 0;
    
    scrollToSelected(hoursWheel, selectedHour);
    scrollToSelected(minutesWheel, selectedMinute);
    
    function scrollToSelected(wheel, value) {
        const option = wheel.querySelector(`[data-value="${value.toString().padStart(2, '0')}"]`);
        if (option) {
            wheel.scrollTop = option.offsetTop - wheel.offsetHeight / 2 + option.offsetHeight / 2;
        }
    }
    
    function updateTime() {
        const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        input.value = timeStr;
    }
    
    hoursWheel.querySelectorAll('.time-option').forEach(opt => {
        opt.addEventListener('click', () => {
            hoursWheel.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedHour = parseInt(opt.dataset.value);
            updateTime();
        });
    });
    
    minutesWheel.querySelectorAll('.time-option').forEach(opt => {
        opt.addEventListener('click', () => {
            minutesWheel.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedMinute = parseInt(opt.dataset.value);
            updateTime();
        });
    });
}

// Инициализация DateTime Picker
initDateTimePicker(id) {
    const tabs = document.getElementById(`${id}-tabs`);
    const content = document.getElementById(`${id}-content`);
    const display = document.getElementById(`${id}-display`);
    
    display.addEventListener('click', () => {
        const isVisible = tabs.style.display !== 'none';
        tabs.style.display = isVisible ? 'none' : 'flex';
        content.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            initDatePicker(`${id}-date`);
            initTimePicker(`${id}-time`);
        }
    });
    
    tabs.querySelectorAll('.datetime-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            tabs.querySelectorAll('.datetime-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            content.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.dataset.pane === tabName);
            });
        });
    });
}

// Инициализация Color Picker
initColorPicker(id, defaultColor) {
    const display = document.getElementById(`${id}-display`);
    const dropdown = document.getElementById(`${id}-dropdown`);
    const input = document.getElementById(id);
    const preview = display.querySelector('.color-preview');
    const valueSpan = display.querySelector('.color-value');
    const nativeInput = document.getElementById(`${id}-native`);
    const hexInput = document.getElementById(`${id}-hex`);
    
    display.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    function updateColor(color) {
        input.value = color;
        preview.style.backgroundColor = color;
        valueSpan.textContent = color;
        nativeInput.value = color;
        hexInput.value = color;
        
        dropdown.querySelectorAll('.color-preset-item svg').forEach(svg => svg.remove());
        const selected = dropdown.querySelector(`[data-color="${color}"]`);
        if (selected) {
            selected.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        }
    }
    
    dropdown.querySelectorAll('.color-preset-item').forEach(item => {
        item.addEventListener('click', () => {
            updateColor(item.dataset.color);
        });
    });
    
    nativeInput.addEventListener('input', (e) => {
        updateColor(e.target.value);
    });
    
    hexInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            updateColor(value);
        }
    });
}

// Инициализация Custom Select
initCustomSelect(id) {
    const display = document.getElementById(`${id}-display`);
    const dropdown = document.getElementById(`${id}-dropdown`);
    const input = document.getElementById(id);
    const valueSpan = display.querySelector('.select-value');
    
    display.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    dropdown.querySelectorAll('.select-option').forEach(option => {
        option.addEventListener('click', () => {
            dropdown.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            input.value = option.dataset.value;
            valueSpan.textContent = option.textContent;
            dropdown.style.display = 'none';
        });
    });
}

// Инициализация Range Slider
initCustomRange(id) {
    const slider = document.getElementById(`${id}-slider`);
    const valueSpan = document.getElementById(`${id}-value`);
    const progress = document.getElementById(`${id}-progress`);
    const input = document.getElementById(id);
    
    slider.addEventListener('input', (e) => {
        const value = e.target.value;
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const percentage = ((value - min) / (max - min)) * 100;
        
        input.value = value;
        valueSpan.textContent = value;
        progress.style.width = percentage + '%';
    });
}

// Инициализация File Input
initFileInput(id) {
    const fileInput = document.getElementById(id);
    const label = fileInput.nextElementSibling;
    const fileText = label.querySelector('.file-text');
    
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            if (files.length === 1) {
                fileText.textContent = files[0].name;
            } else {
                fileText.textContent = `${files.length} files selected`;
            }
        } else {
            fileText.textContent = 'Choose file...';
        }
    });
}

// Настройка событий модального окна
setupModalEvents(modalDiv, id, type) {
    const cancelBtn = document.getElementById('cancel-modal');
    const submitBtn = document.getElementById('submit-modal');
    
    const modalBg = document.getElementById('modal') || document.createElement('div');
    
    // Закрытие dropdown при клике вне
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.date-picker-container') && 
            !e.target.closest('.time-picker-container') &&
            !e.target.closest('.datetime-picker-container') &&
            !e.target.closest('.color-picker-container') &&
            !e.target.closest('.custom-select-container')) {
            document.querySelectorAll('[id$="-dropdown"]').forEach(dd => dd.style.display = 'none');
            document.querySelectorAll('[id$="-tabs"]').forEach(tab => tab.style.display = 'none');
            document.querySelectorAll('[id$="-content"]').forEach(content => content.style.display = 'none');
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        modalBg.remove();
        document.getElementById('content')?.classList.remove('modal-open');
    });
    
    submitBtn.addEventListener('click', () => {
        const input = document.getElementById(id);
        const value = input.value;
        
        // Здесь можно добавить валидацию
        
        modalBg.remove();
        document.getElementById('content')?.classList.remove('modal-open');
        
        // Возврат значения через промис
        console.log('Selected value:', value);
    });
}

// Вспомогательная функция форматирования даты
formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}
}

window.modalMgr = new ModalMgr;