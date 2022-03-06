// Wordle Clone Script

// Based on Paul Akinyemi' "How to Build a Wordle Clone in JavaScript" article on freeCodeCamp
// https://www.freecodecamp.org/news/build-a-wordle-clone-in-javascript/

const NUMBER_OF_GUESSES = 6;

const COLOR_THEME = 'dark';

let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)];

function initBoard() {
    let board = document.getElementById('game-board');
    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        let row = document.createElement('div');
        row.className = 'letter-row';
        for (let j = 0; j < 5; j++) {
            let box = document.createElement('div');
            box.className = 'letter-box';
            box.dataset.state = 'empty';
            row.appendChild(box);
        }
        board.appendChild(row);
    }
}

function initKeyboard() {
    let cont = document.getElementById('keyboard-cont');
    let layout = {
        'first-row': 'q w e r t y u i o p',
        'second-row': 'a s d f g h j k l',
        'third-row': 'Del z x c v b n m Enter'
    };
    let keys = Object.keys(layout);
    keys.forEach(group => {
        let row = document.createElement('div');
        row.className = 'row';
        row.classList.add(group);
        let keys = (layout[group]).split(' ');
        keys.forEach(key => {
            let button = document.createElement('button');
            button.className = 'keyboard-button';
            button.dataset.state = 'normal';
            button.innerText = key;
            row.appendChild(button);
        });
        cont.appendChild(row);
    });
}

document.getElementsByTagName('body')[0].className = COLOR_THEME;
initBoard();
initKeyboard();

document.addEventListener('keyup', (e) => {
    if (guessesRemaining === 0) {
        return;
    }
    let pressedKey = String(e.key);
    if (pressedKey === 'Backspace' && nextLetter !== 0) {
        deleteLetter();
        return;
    }
    if (pressedKey === 'Enter') {
        checkGuess();
        return;
    }
    let found = pressedKey.match(/[a-z]/gi);
    if (!found || pressedKey.length > 1) {
        return;
    } else {
        insertLetter(pressedKey);
    }
});

document.getElementById('keyboard-cont').addEventListener('click', (e) => {
    const target = e.target;
    if (!target.classList.contains('keyboard-button')) {
        return;
    }
    let key = target.textContent;
    if (key === 'Del') {
        key = 'Backspace';
    }
    document.dispatchEvent(new KeyboardEvent('keyup', { 'key': key }));
});

function insertLetter(pressedKey) {
    if (nextLetter === 5) {
        return;
    }
    pressedKey = pressedKey.toLowerCase();
    let row = document.getElementsByClassName('letter-row')[6 - guessesRemaining];
    let box = row.children[nextLetter];
    animateCSS(box, 'bounceIn');
    box.textContent = pressedKey;
    box.dataset.state = 'filled';
    currentGuess.push(pressedKey);
    nextLetter += 1;
}

function deleteLetter() {
    let row = document.getElementsByClassName('letter-row')[6 - guessesRemaining];
    let box = row.children[nextLetter - 1];
    // animateCSS(box, 'bounceOut');
    box.textContent = '';
    box.dataset.state = 'empty';
    currentGuess.pop();
    nextLetter -= 1;
}

function checkGuess() {
    let row = document.getElementsByClassName('letter-row')[6 - guessesRemaining];
    let guessString = '';
    let rightGuess = Array.from(rightGuessString);
    for (const val of currentGuess) {
        guessString += val;
    }
    if (guessString.length != 5) {
        animateCSS(row, 'flash');
        toastr.error('Not enough letters!');
        return;
    }
    if (!WORDS.includes(guessString)) {
        animateCSS(row, 'shakeX');
        toastr.error('Word not in list!');
        return;
    }
    for (let i = 0; i < 5; i++) {
        let letterState = '';
        let box = row.children[i];
        let letter = currentGuess[i];
        let letterPosition = rightGuess.indexOf(currentGuess[i]);
        if (letterPosition === -1) {
            letterState = 'absent';
        } else {
            if (currentGuess[i] === rightGuess[i]) {
                letterState = 'correct';
            } else {
                letterState = 'present';
            }
            rightGuess[letterPosition] = '#';
        }
        let delay = 250 * i;
        setTimeout(() => {
            animateCSS(box, 'flip', 250);
            box.dataset.state = letterState;
            shadeKeyboard(letter, letterState);
        }, delay);
    }
    if (guessString === rightGuessString) {
        toastr.success('You guessed right! Game over!');
        guessesRemaining = 0;
        return;
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;
        if (guessesRemaining === 0) {
            toastr.error('You\'ve run out of guesses! Game over!');
            toastr.info(`The right word was: "${rightGuessString}"`);
        }
    }
}

function shadeKeyboard(letter, state) {
    for (const elem of document.getElementsByClassName('keyboard-button')) {
        if (elem.textContent === letter) {
            let oldState = elem.dataset.state;
            if (oldState === 'correct') {
                return;
            }
            if (oldState === 'present' && state !== 'correct') {
                return;
            }
            if (oldState)
                elem.classList.remove(oldState);
            elem.classList.add(state);
            elem.dataset.state = state;
            break;
        }
    }
}

const animateCSS = (element, animation, time = 250, prefix = 'animate__') =>
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        const node = element;
        node.style.setProperty('--animate-duration', `${time}ms`);
        node.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });

// End of code.