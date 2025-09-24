const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const memoryIndicator = document.getElementById('memory-indicator');
    const menuButton = document.getElementById('menu-button');
    const menuDropdown = document.getElementById('menu-dropdown');
    const menuItems = document.querySelectorAll('.menu-item');
    const windowControls = document.querySelectorAll('.control');
    const themeToggle = document.getElementById('theme-toggle');
    const basicKeypad = document.getElementById('basic-keypad');
    const scientificKeypad = document.getElementById('scientific-keypad');
    const programmerKeypad = document.getElementById('programmer-keypad');
    const body = document.body;
    
    // Variables de estado de la calculadora
    let currentInput = '0';
    let previousInput = '';
    let operation = null;
    let shouldResetScreen = false;
    let memory = 0;
    let isScientificMode = false;
    let isProgrammerMode = false;
    let isRadians = true;
    
    // Variables para el modo programador
    let currentBase = 'dec';
    let bitLength = 32;
    let isUnsigned = false;
    let programmerValue = 0;
    
    // Update display
    function updateDisplay() {
        display.textContent = formatNumber(currentInput);
        memoryIndicator.textContent = memory !== 0 ? 'M' : '';
    }
    
    // Format number for display
    function formatNumber(num) {
        if (num === 'Error' || num === 'Infinity') return num;
        
        // Limitar a 10 caracteres para pantalla
        if (num.length > 10) {
            const number = parseFloat(num);
            return isNaN(number) ? num : number.toExponential(5);
        }
        return num;
    }
    
    // Reset calculator
    function resetCalculator() {
        currentInput = '0';
        previousInput = '';
        operation = null;
        shouldResetScreen = false;
        updateDisplay();
    }
    
    // Append number
    function appendNumber(number) {
        if (currentInput === '0' || shouldResetScreen) {
            currentInput = number;
            shouldResetScreen = false;
        } else if (currentInput.length < 10) {
            currentInput += number;
        }
        updateDisplay();
    }
    
    // Choose operation
    function chooseOperation(op) {
        if (currentInput === '0') return;
        
        if (previousInput !== '') {
            calculate();
        }
        
        operation = op;
        previousInput = currentInput;
        shouldResetScreen = true;
    }
    
    // Calculate
    function calculate() {
        let computation;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        switch (operation) {
            case '+':
                computation = prev + current;
                break;
            case '−':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    currentInput = 'Error';
                    updateDisplay();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }
        
        // Redondear para evitar decimales largos
        computation = Math.round(computation * 100000000) / 100000000;
        
        currentInput = computation.toString();
        operation = null;
        previousInput = '';
        shouldResetScreen = true;
        updateDisplay();
    }
    
    // Scientific functions
    function executeScientificFunction(func) {
        const current = parseFloat(currentInput);
        let computation;
        
        if (isNaN(current) && func !== 'pi' && func !== 'e' && func !== 'rand' && func !== 'rad') {
            return;
        }
        
        switch (func) {
            case 'x³':
                computation = Math.pow(current, 3);
                break;
            case 'e^x':
                computation = Math.exp(current);
                break;
            case '10^x':
                computation = Math.pow(10, current);
                break;
            case 'y√x':
                if (previousInput) {
                    const y = parseFloat(previousInput);
                    computation = Math.pow(current, 1/y);
                }
                break;
            case 'ln':
                if (current <= 0) {
                    currentInput = 'Error';
                    updateDisplay();
                    return;
                }
                computation = Math.log(current);
                break;
            case 'log':
                if (current <= 0) {
                    currentInput = 'Error';
                    updateDisplay();
                    return;
                }
                computation = Math.log10(current);
                break;
            case 'sin':
                computation = isRadians ? Math.sin(current) : Math.sin(current * Math.PI / 180);
                break;
            case 'cos':
                computation = isRadians ? Math.cos(current) : Math.cos(current * Math.PI / 180);
                break;
            case 'tan':
                computation = isRadians ? Math.tan(current) : Math.tan(current * Math.PI / 180);
                break;
            case 'sinh':
                computation = Math.sinh(current);
                break;
            case 'cosh':
                computation = Math.cosh(current);
                break;
            case 'tanh':
                computation = Math.tanh(current);
                break;
            case 'pi':
                computation = Math.PI;
                break;
            case 'e':
                computation = Math.E;
                break;
            case 'ee':
                currentInput = parseFloat(currentInput).toExponential();
                updateDisplay();
                return;
            case 'rad':
                isRadians = !isRadians;
                display.textContent = isRadians ? 'Rad' : 'Deg';
                setTimeout(() => updateDisplay(), 1000);
                return;
            case 'rand':
                computation = Math.random();
                break;
            default:
                return;
        }
        
        if (computation !== undefined) {
            computation = Math.round(computation * 100000000) / 100000000;
            currentInput = computation.toString();
            updateDisplay();
        }
    }
    
    // Add decimal point
    function addDecimal() {
        if (shouldResetScreen) {
            currentInput = '0.';
            shouldResetScreen = false;
        } else if (!currentInput.includes('.')) {
            currentInput += '.';
        }
        updateDisplay();
    }
    
    // Calculate percentage
    function calculatePercentage() {
        const current = parseFloat(currentInput);
        currentInput = (current / 100).toString();
        updateDisplay();
    }
    
    // Change sign
    function changeSign() {
        currentInput = (parseFloat(currentInput) * -1).toString();
        updateDisplay();
    }
    
    // Memory functions
    function memoryClear() {
        memory = 0;
        updateDisplay();
    }
    
    function memoryAdd() {
        memory += parseFloat(currentInput);
        updateDisplay();
    }
    
    function memorySubtract() {
        memory -= parseFloat(currentInput);
        updateDisplay();
    }
    
    function memoryRecall() {
        currentInput = memory.toString();
        updateDisplay();
    }
    
    // Toggle theme
    function toggleTheme() {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeToggle.textContent = 'Modo Claro';
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeToggle.textContent = 'Modo Oscuro';
        }
    }
    
    // Toggle calculator mode
    function toggleCalculatorMode(mode) {
        // Ocultar todos los modos primero
        basicKeypad.style.display = 'none';
        scientificKeypad.style.display = 'none';
        programmerKeypad.style.display = 'none';
        
        // Mostrar el modo seleccionado
        if (mode === 'basic') {
            basicKeypad.style.display = 'flex';
            isScientificMode = false;
            isProgrammerMode = false;
        } else if (mode === 'scientific') {
            scientificKeypad.style.display = 'flex';
            isScientificMode = true;
            isProgrammerMode = false;
        } else if (mode === 'programmer') {
            programmerKeypad.style.display = 'flex';
            isScientificMode = false;
            isProgrammerMode = true;
            initProgrammerMode();
        }
    }
    
    // Funciones para el modo programador
    function initProgrammerMode() {
        currentBase = 'dec';
        bitLength = 32;
        isUnsigned = false;
        programmerValue = parseInt(currentInput) || 0;
        
        updateBaseButtons();
        updateBitButtons();
        updateProgrammerDisplay();
    }
    
    function setNumberBase(base) {
        currentBase = base;
        updateBaseButtons();
        updateProgrammerDisplay();
    }
    
    function setBitLength(bits) {
        bitLength = parseInt(bits);
        updateBitButtons();
        applyBitMask();
        updateProgrammerDisplay();
    }
    
    function toggleSignedUnsigned() {
        isUnsigned = !isUnsigned;
        applyBitMask();
        updateProgrammerDisplay();
    }
    
    function applyBitMask() {
        let mask;
        if (bitLength === 8) {
            mask = isUnsigned ? 0xFF : 0x7F;
        } else if (bitLength === 16) {
            mask = isUnsigned ? 0xFFFF : 0x7FFF;
        } else if (bitLength === 32) {
            mask = isUnsigned ? 0xFFFFFFFF : 0x7FFFFFFF;
        } else {
            mask = isUnsigned ? 0xFFFFFFFFFFFFFFFF : 0x7FFFFFFFFFFFFFFF;
        }
        
        programmerValue = programmerValue & mask;
        
        if (!isUnsigned && (programmerValue & (1 << (bitLength - 1))) !== 0) {
            programmerValue = programmerValue | (~mask);
        }
    }
    
    function updateProgrammerDisplay() {
        let displayValue;
        
        switch (currentBase) {
            case 'hex':
                displayValue = programmerValue.toString(16).toUpperCase();
                break;
            case 'dec':
                displayValue = programmerValue.toString(10);
                break;
            case 'oct':
                displayValue = programmerValue.toString(8);
                break;
            case 'bin':
                displayValue = programmerValue.toString(2);
                if (displayValue.length > 4) {
                    displayValue = displayValue.replace(/(\d{4})(?=\d)/g, '$1 ');
                }
                break;
            default:
                displayValue = programmerValue.toString(10);
        }
        
        display.textContent = displayValue;
        updateBaseIndicator();
    }
    
    function updateBaseIndicator() {
        const baseIndicator = document.getElementById('base-indicator');
        if (baseIndicator) {
            baseIndicator.textContent = currentBase.toUpperCase();
        }
    }
    
    function updateBaseButtons() {
        document.querySelectorAll('.base-btn').forEach(btn => {
            if (btn.getAttribute('data-base') === currentBase) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    function updateBitButtons() {
        document.querySelectorAll('.bit-btn').forEach(btn => {
            if (parseInt(btn.getAttribute('data-bits')) === bitLength) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    function handleProgrammerFunction(func) {
        switch (func) {
            case 'lsh':
                programmerValue = programmerValue << 1;
                applyBitMask();
                break;
            case 'rsh':
                programmerValue = programmerValue >> 1;
                break;
            case 'lrsh':
                programmerValue = programmerValue >>> 1;
                break;
            case 'and':
                operation = 'and';
                previousInput = programmerValue;
                shouldResetScreen = true;
                break;
            case 'or':
                operation = 'or';
                previousInput = programmerValue;
                shouldResetScreen = true;
                break;
            case 'xor':
                operation = 'xor';
                previousInput = programmerValue;
                shouldResetScreen = true;
                break;
            case 'not':
                programmerValue = ~programmerValue;
                applyBitMask();
                break;
            case 'mod':
                operation = 'mod';
                previousInput = programmerValue;
                shouldResetScreen = true;
                break;
            case 'rotl':
                programmerValue = (programmerValue << 1) | (programmerValue >>> (bitLength - 1));
                applyBitMask();
                break;
            case 'rotr':
                programmerValue = (programmerValue >>> 1) | (programmerValue << (bitLength - 1));
                applyBitMask();
                break;
            default:
                return;
        }
        
        updateProgrammerDisplay();
    }
    
    function handleProgrammerLetter(letter) {
        if (currentBase !== 'hex') return;
        
        const value = parseInt(letter, 16);
        if (isNaN(value)) return;
        
        if (shouldResetScreen) {
            programmerValue = value;
            shouldResetScreen = false;
        } else {
            programmerValue = (programmerValue * 16) + value;
        }
        
        applyBitMask();
        updateProgrammerDisplay();
    }
    
    function calculateProgrammer() {
        if (operation && previousInput !== '') {
            const prev = parseInt(previousInput);
            const current = parseInt(programmerValue);
            
            if (isNaN(prev) || isNaN(current)) return;
            
            switch (operation) {
                case 'and':
                    programmerValue = prev & current;
                    break;
                case 'or':
                    programmerValue = prev | current;
                    break;
                case 'xor':
                    programmerValue = prev ^ current;
                    break;
                case 'mod':
                    if (current === 0) {
                        display.textContent = 'Error';
                        return;
                    }
                    programmerValue = prev % current;
                    break;
            }
            
            applyBitMask();
            operation = null;
            previousInput = '';
            shouldResetScreen = true;
            updateProgrammerDisplay();
        }
    }
    
    // Window control functions
    windowControls.forEach(control => {
        control.addEventListener('click', (e) => {
            const action = e.target.classList[1];
            ipcRenderer.send('window-control', action);
        });
    });
    
    // Menu functionality
    menuButton.addEventListener('click', () => {
        menuDropdown.classList.toggle('show');
    });
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const mode = item.getAttribute('data-mode');
            
            if (mode === 'scientific') {
                toggleCalculatorMode('scientific');
            } else if (mode === 'programmer') {
                toggleCalculatorMode('programmer');
            } else if (mode === 'basic') {
                toggleCalculatorMode('basic');
            } else if (mode === 'converter') {
                alert('Modo convertir en desarrollo');
            }
            
            menuDropdown.classList.remove('show');
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
        }
    });
    
    // Button event listeners for basic mode
    document.querySelectorAll('.btn.number').forEach(button => {
        button.addEventListener('click', () => {
            const number = button.getAttribute('data-number');
            if (number === '.') {
                addDecimal();
            } else {
                appendNumber(number);
            }
        });
    });
    
    document.querySelectorAll('.btn.operation').forEach(button => {
        button.addEventListener('click', () => {
            const op = button.getAttribute('data-operation');
            chooseOperation(op);
        });
    });
    
    document.querySelectorAll('.btn.function').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.getAttribute('data-action');
            
            switch (action) {
                case 'clear':
                    resetCalculator();
                    break;
                case 'sign':
                    changeSign();
                    break;
                case 'percent':
                    calculatePercentage();
                    break;
                case 'calculate':
                    if (isProgrammerMode) {
                        calculateProgrammer();
                    } else {
                        calculate();
                    }
                    break;
            }
        });
    });
    
    document.querySelectorAll('.btn.memory').forEach(button => {
        button.addEventListener('click', () => {
            const memoryAction = button.getAttribute('data-memory');
            
            switch (memoryAction) {
                case 'mc':
                    memoryClear();
                    break;
                case 'm+':
                    memoryAdd();
                    break;
                case 'm-':
                    memorySubtract();
                    break;
                case 'mr':
                    memoryRecall();
                    break;
            }
        });
    });
    
    // Button event listeners for scientific mode
    document.querySelectorAll('.btn.scientific').forEach(button => {
        button.addEventListener('click', () => {
            const func = button.getAttribute('data-func');
            executeScientificFunction(func);
        });
    });
    
    // Button event listeners for programmer mode
    document.querySelectorAll('.base-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setNumberBase(btn.getAttribute('data-base'));
        });
    });
    
    document.querySelectorAll('.bit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setBitLength(btn.getAttribute('data-bits'));
        });
    });
    
    document.querySelectorAll('.btn.programmer[data-func]').forEach(btn => {
        btn.addEventListener('click', () => {
            handleProgrammerFunction(btn.getAttribute('data-func'));
        });
    });
    
    document.querySelectorAll('.btn.programmer[data-value]').forEach(btn => {
        btn.addEventListener('click', () => {
            handleProgrammerLetter(btn.getAttribute('data-value'));
        });
    });
    
    // Signed/unsigned toggle
    const signedToggle = document.getElementById('signed-toggle');
    if (signedToggle) {
        signedToggle.addEventListener('click', toggleSignedUnsigned);
    }
    
    // Keyboard support
    document.addEventListener('keydown', (event) => {
        if (/[0-9]/.test(event.key)) {
            appendNumber(event.key);
        } else if (event.key === '.') {
            addDecimal();
        } else if (event.key === '+') {
            chooseOperation('+');
        } else if (event.key === '-') {
            chooseOperation('−');
        } else if (event.key === '*') {
            chooseOperation('×');
        } else if (event.key === '/') {
            chooseOperation('÷');
        } else if (event.key === 'Enter' || event.key === '=') {
            if (isProgrammerMode) {
                calculateProgrammer();
            } else {
                calculate();
            }
        } else if (event.key === 'Escape') {
            resetCalculator();
        } else if (event.key === '%') {
            calculatePercentage();
        } else if (event.key === 'm' && event.ctrlKey) {
            memoryAdd();
        } else if (event.key === 'r' && event.ctrlKey) {
            memoryRecall();
        }
    });
    
    // Initialize calculator
    resetCalculator();
    
    // Make window draggable
    const titlebar = document.querySelector('.macos-titlebar');
    titlebar.style.webkitAppRegion = 'drag';
    
    // Check window size on load and resize
    function checkWindowSize() {
        if (window.innerWidth >= 901 && !isProgrammerMode) {
            toggleCalculatorMode('scientific');
        } else if (window.innerWidth < 901 && !isProgrammerMode) {
            toggleCalculatorMode('basic');
        }
    }
    
    window.addEventListener('resize', checkWindowSize);
    checkWindowSize();
});