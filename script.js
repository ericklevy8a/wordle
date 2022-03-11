//
// Wordle Clone Script
//

// Inspired on Josh Wardle game
// https://www.nytimes.com/games/wordle/index.html
// Based on Paul Akinyemi' "How to Build a Wordle Clone in JavaScript" article on freeCodeCamp
// https://www.freecodecamp.org/news/build-a-wordle-clone-in-javascript/

const NUMBER_OF_GUESSES = 6;

let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;

let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)];

let wordleState = getWordleState() || false;
let wordleStats = getWordleStats() || false;
let wordleSettings = getWordleSettings() || false;

if (wordleSettings.darkTheme) document.body.classList.add('dark-theme');
if (wordleSettings.highContrast) document.body.classList.add('high-contrast');

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
        'third-row': 'Enter z x c v b n m Del'
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
            button.dataset.key = key;
            button.innerText = key;
            row.appendChild(button);
        });
        cont.appendChild(row);
    });
    document.querySelector('.keyboard-button[data-key="Del"]').innerHTML = '<i class="material-icons-outlined no-pointer-events">backspace</i>';
}

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
    let key = target.dataset.key;
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
    let row = document.getElementsByClassName('letter-row')[NUMBER_OF_GUESSES - guessesRemaining];
    let box = row.children[nextLetter];
    animateCSS(box, 'bounceIn');
    box.textContent = pressedKey;
    box.dataset.state = 'filled';
    currentGuess.push(pressedKey);
    nextLetter += 1;
}

function deleteLetter() {
    let row = document.getElementsByClassName('letter-row')[NUMBER_OF_GUESSES - guessesRemaining];
    let box = row.children[nextLetter - 1];
    box.textContent = '';
    box.dataset.state = 'empty';
    currentGuess.pop();
    nextLetter -= 1;
}

function checkGuess() {
    let row = document.getElementsByClassName('letter-row')[NUMBER_OF_GUESSES - guessesRemaining];
    let guessString = '';
    let rightGuess = Array.from(rightGuessString);
    for (const val of currentGuess) {
        guessString += val;
    }
    if (guessString.length != 5) {
        toastr.error('Not enough letters!');
        animateCSS(row, 'flash');
        return;
    }
    if (!WORDS.includes(guessString)) {
        toastr.error('Word not in list!');
        animateCSS(row, 'shakeX');
        return;
    }
    let evaluations = [null, null, null, null, null];
    // Check first correct cases only to avoid a repeated letter discrepancy
    for (let i = 0; i < 5; i++) {
        if (currentGuess[i] === rightGuess[i]) {
            evaluations[i] = 'correct';
            rightGuess[i] = '#'; // obfuscate this correct case
        }
    }
    // Check present and absent cases
    for (let i = 0; i < 5; i++) {
        if (evaluations[i] !== 'correct') {
            if (rightGuess.indexOf(currentGuess[i]) === -1) {
                evaluations[i] = 'absent';
            } else {
                evaluations[i] = 'present';
            }
        }
    }
    // Display the evaluation results
    for (let i = 0; i < 5; i++) {
        let box = row.children[i];
        let letter = currentGuess[i];
        let delay = 250 * i;
        setTimeout(() => {
            animateCSS(box, 'flip');
            box.dataset.state = evaluations[i];
            shadeKeyboard(letter, evaluations[i]);
        }, delay);
    }
    // Update game state
    if (wordleState) {
        wordleState.evaluations[NUMBER_OF_GUESSES - guessesRemaining] = evaluations;
        wordleState.boardState[NUMBER_OF_GUESSES - guessesRemaining] = currentGuess.join('');
    }
    // Check for game over condition
    if (guessString === rightGuessString) {
        toastr.success('You guessed right! Game over!');
        // Update statistics and store
        if (wordleStats) {
            wordleStats.gamesPlayed += 1;
            wordleStats.gamesWon += 1;
            wordleStats.highlight = NUMBER_OF_GUESSES - guessesRemaining + 1;
            wordleStats.guesses[wordleStats.highlight] += 1;
            wordleStats.averageGuesses = averageGuesses();
            wordleStats.currentStreak += 1;
            wordleStats.maxStreak = Math.max(wordleStats.maxStreak, wordleStats.currentStreak)
            wordleStats.winPercentage = wordleStats.gamesWon / wordleStats.gamesPlayed * 100;
            storeWordleStats();
        }
        // Update game state and store
        if (wordleState) {
            wordleState.gameStatus = 'WIN';
            storeWordleState();
        }
        guessesRemaining = 0;
        // Show statistics
        setTimeout(showStats, 3000);
        return;
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;
        if (guessesRemaining === 0) {
            toastr.error('You\'ve run out of guesses! Game over!');
            toastr.info(`The right word was: "${rightGuessString}"`);
            // Update statistics and store
            if (wordleStats) {
                wordleStats.gamesPlayed += 1;
                wordleStats.guesses.fail += 1;
                wordleStats.highlight = 0;
                wordleStats.currentStreak = 0;
                wordleStats.winPercentage = wordleStats.gamesWon / wordleStats.gamesPlayed * 100;
                storeWordleStats();
            }
            // Update game state and store
            if (wordleState) {
                wordleState.gameStatus = 'LOST';
                storeWordleState();
            }
            return;
        }
        if (wordleState) wordleState.rowIndex += 1;
    }
    // Store game state
    if (wordleState) storeWordleState();
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

// Animation CSS class injector
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

// LOCAL STORAGE FUNCTIONS

function restoreWordleState() {
    if (wordleState) {
        if (wordleState.gameStatus === 'IN_PROGRESS') {
            rightGuessString = wordleState.solution;
            for (let i = 0; i < wordleState.rowIndex; i++) {
                let row = document.getElementsByClassName('letter-row')[i];
                for (let j = 0; j < 5; j++) {
                    let box = row.children[j];
                    let letter = wordleState.boardState[i][j];
                    let letterState = wordleState.evaluations[i][j];
                    box.textContent = letter;
                    box.dataset.state = letterState;
                    shadeKeyboard(letter, letterState);
                }
            }
            guessesRemaining = NUMBER_OF_GUESSES - wordleState.rowIndex;
        } else {
            // TODO: Check game countdown clock to reset
            // Meanwhile, reset game state ever not IN_PROGRESS
            wordleState.solution = rightGuessString;
            wordleState.gameStatus = 'IN_PROGRESS';
            wordleState.rowIndex = 0;
            wordleState.boardState = ['', '', '', '', '', ''];
            wordleState.evaluations = [null, null, null, null, null, null];
            storeWordleState();
        }
    }
}


function getWordleState() {
    if (typeof (Storage) !== 'undefined') {
        return JSON.parse(localStorage.getItem('wordle-state')) ||
        {
            boardState: ["", "", "", "", "", ""],
            evaluations: [null, null, null, null, null, null],
            gameStatus: "",
            rowIndex: 0,
            solution: ""
        }
    }
}

function storeWordleState() {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('wordle-state', JSON.stringify(wordleState));
    }
}

function getWordleStats() {
    if (typeof (Storage) !== 'undefined') {
        return JSON.parse(localStorage.getItem('wordle-stats')) ||
        {
            gamesPlayed: 0,
            gamesWon: 0,
            guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 },
            averageGuesses: 0.0,
            currentStreak: 0,
            maxStreak: 0,
            winPercentage: 0.0
        }
    }
}

function storeWordleStats() {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('wordle-stats', JSON.stringify(wordleStats));
    }
}

function averageGuesses() {
    if (wordleStats) {
        let games = 0;
        let guesses = 0;
        for (let i = 1; i <= NUMBER_OF_GUESSES; i++) {
            games += wordleStats.guesses[i];
            guesses += i * wordleStats.guesses[i];
        }
        if (games > 0) {
            return guesses / games;
        }
    }
    return 0.0;
}

function getWordleSettings() {
    if (typeof (Storage) !== 'undefined') {
        return JSON.parse(localStorage.getItem('wordle-settings')) ||
        {
            hardMode: false,
            darkTheme: false,
            highContrast: false
        }
    }
}

function storeWordleSettings(wordleSettings) {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('wordle-settings', JSON.stringify(wordleSettings));
    }
}

// NAV BAR ACTIONS

function showHelp() {
    let msg = `
        <div id="help-container">
            <h5>HOW TO PLAY</h5>
            <p>Guess the word in six tries or less.</p>
            <p>Each guess must be a valid five-letter word.</p>
            <p>Use the Enter key to evaluate the word or Del/Backspace key to make corrections.</p>
            <p>With each guess, the color of the tiles and keys will change to show how close your guess was to the right word.</p>
            <p><span class="green"><b>Green</b></span>: letter is in the correct spot.<br>
            <span class="yellow"><b>Yellow</b></span>: letter is in the word but in the wrong spot.<br>
            <span class="darkgrey"><b>Greyish</b></span>: letter is not in the word in any spot.</p>
            <h5>ABOUT THIS GAME</h5>
            <p>© Copyright 2022 by Erick Levy!</p>
            <p>Inspired on Josh Wardle game and based on Paul Akinyemi\'s article on freeCodeCamp "How to Build a Wordle Clone in JavaScript".</p>
            <p>Thank you for taking the time to learn about and play with this little app.</p>
            <h5>ADVICE</h5>
            <p>This is a work in progress. Check for a TO DO list in the GitHub repository readme.md file.</p>
        </div>
    `;
    msgbox('', msg);
}

function showStats() {
    let html = `
        <div id="stats-container">
            <h5>Statistics</h5>
            <table id="stats-table">
                <tr>
                    <td class="number">${wordleStats.gamesPlayed}</td>
                    <td class="number">${wordleStats.gamesWon}</td>
                    <td class="number">${Math.round(wordleStats.winPercentage)}</td>
                    <td class="number">${wordleStats.currentStreak}</td>
                    <td class="number">${wordleStats.maxStreak}</th>
                </tr>
                <tr>
                    <td class="label">Played</td>
                    <td class="label">Won</td>
                    <td class="label">Win %</td>
                    <td class="label">Current Streak</td>
                    <td class="label">Max Streak</td>
                </tr>
            </table>
            <h5>Guess Distribution</h5>
            <div id="stats-graph">`;
    let maxGuesses = 0;
    for (let i = 1; i <= NUMBER_OF_GUESSES; i++) {
        if (wordleStats.guesses[i] > maxGuesses) maxGuesses = wordleStats.guesses[i];
    }
    for (let i = 1; i <= NUMBER_OF_GUESSES; i++) {
        let width = Math.round(wordleStats.guesses[i] / maxGuesses * 100);
        let highlight = (wordleStats.highlight == i) ? 'highlight' : '';
        html += `
            <div class="bar-outer">
                <span>${i}</span>
                <div class="bar-inner ${highlight}" style="width: ${width}%">${wordleStats.guesses[i]}</div>
            </div>`;
    }
    html += `
        </div>
    </div>`;
    msgbox('', html);
}

function showSettings() {
    let html = `
        <div id="settings-container">
            <h5>Settings</h5>
            <div class="setting">
                <div class="Text">
                    <div class="title">Hard Mode</div>
                    <div class="description">Any revealed hints must be used in subsequent guesses</div>
                </div>
                <div class="control">
                    <div class="switch" id="hard-mode" name="hardMode" ${wordleSettings.hardMode ? 'checked' : ''}>
                        <span class="knob"></span>
                    </div>
                </div>
            </div>

            <div class="setting">
                <div class="Text">
                    <div class="title">Dark Theme</div>
                    <div class="description">Reduce luminance to ergonmy levels</div>
                </div>
                <div class="control">
                    <div class="switch" id="dark-theme" name="dark-theme" ${wordleSettings.darkTheme ? 'checked' : ''}>
                        <div class="knob">&nbsp;</div>
                    </div>
                </div>
            </div>

            <div class="setting">
                <div class="Text">
                    <div class="title">High Contrast</div>
                    <div class="description">For improved color vision</div>
                </div>
                <div class="control">
                    <div class="switch" id="high-contrast" name="high-contrast" ${wordleSettings.highContrast ? 'checked' : ''}>
                        <span class="knob"></span>
                    </div>
                </div>
            </div>

        </div>`;
    msgbox('', html);
    document.getElementById('settings-container').addEventListener('click', (e) => {
        let target = e.target;
        let name = target.getAttribute('name');
        let checked = (target.getAttribute('checked') == null);
        if (name == 'dark-theme') {
            wordleSettings.darkTheme = checked;
            if (checked) {
                document.body.classList.add('dark-theme');
                target.setAttribute('checked', '');
            } else {
                document.body.classList.remove('dark-theme');
                target.removeAttribute('checked');
            }
        }
        if (name == 'high-contrast') {
            wordleSettings.highContrast = checked;
            if (checked) {
                document.body.classList.add('high-contrast');
                target.setAttribute('checked', '');
            } else {
                document.body.classList.remove('high-contrast');
                target.removeAttribute('checked');
            }
        }
        storeWordleSettings(wordleSettings);
    });
}

function initNavBar() {
    document.getElementById('button-menu').addEventListener('click', () => { toastr.warning('Menu dialog is a work in progres...') });
    document.getElementById('button-help').addEventListener('click', showHelp);
    document.getElementById('button-stats').addEventListener('click', showStats);
    document.getElementById('button-settings').addEventListener('click', showSettings);
}

// Some UI adjustments
toastr.options.positionClass = 'toast-top-center';

// INITIALIZE GAME
initNavBar();
initBoard();
initKeyboard();
restoreWordleState();

// End of code.