//
// Wordle Clone Script
// (c) 2022 by Erick Levy!
//

// Inspired on Josh Wardle game
// https://www.nytimes.com/games/wordle/index.html
// Based on Paul Akinyemi' "How to Build a Wordle Clone in JavaScript" article on freeCodeCamp
// https://www.freecodecamp.org/news/build-a-wordle-clone-in-javascript/

const NUMBER_OF_GUESSES = 6;

const DIFFICULTY = {
    EASY: 0.25,
    MEDIUM: 0.5,
    HARD: 1.0,
}

// Global vars
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let difficulty = DIFFICULTY.EASY;

// Select a random word (require to load words.js from index.html)
let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length * difficulty)];

// Try to get the game state, statistical and settings structures from local storage
let wordleState = getWordleState() || false;
let wordleStats = getWordleStats() || false;
let wordleSettings = getWordleSettings() || false;

// Based on settings apply some general classes to body
if (wordleSettings.darkTheme) document.body.classList.add('dark-theme');
if (wordleSettings.highContrast) document.body.classList.add('high-contrast');

// Initialize the game board creating enough rows and boxes (tiles)
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

// Initialize the game keyboard using a qwerty layout plus Enter & Del keys
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
    // Change the Del text in Del key for a backspace material outlined icon
    // no-pointer-events prevent to catch the click in the icon and let the event to be listened by the button
    document.querySelector('.keyboard-button[data-key="Del"]').innerHTML = '<i class="material-icons-outlined no-pointer-events">backspace</i>';
}

// Add a keyup event listener for the real keyboard to catch the Backspace, the Enter, and all the letter keys
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

// Add a click event listener for the virtual keyboard container
document.getElementById('keyboard-cont').addEventListener('click', (e) => {
    const target = e.target;
    // filter only clicks from virtual keys
    if (!target.classList.contains('keyboard-button')) {
        return;
    }
    let key = target.dataset.key;
    if (key === 'Del') {
        // Translate Del to Backspace key
        key = 'Backspace';
    }
    // Dispatch the click as a keyup event
    document.dispatchEvent(new KeyboardEvent('keyup', { 'key': key }));
});

// Inserts a new letter in the board
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

// Delete the last letter
function deleteLetter() {
    let row = document.getElementsByClassName('letter-row')[NUMBER_OF_GUESSES - guessesRemaining];
    let box = row.children[nextLetter - 1];
    box.textContent = '';
    box.dataset.state = 'empty';
    currentGuess.pop();
    nextLetter -= 1;
}

// Apply some checks and validations to the actual guess string and determine messages and game state
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
    // In hard mode, checks that previus revealed hints has been used
    if (wordleSettings.hardMode) {
        let correctButtons = document.getElementsByClassName('keyboard-button correct');
        let presentNuttons = document.getElementsByClassName('keyboard-button present');
        let buttons = [...correctButtons, ...presentNuttons];
        let keys = [];
        buttons.forEach(element => {
            keys.push(element.dataset.key);
        });
        let flag = false;
        for (let i = 0; i < keys.length; i++) {
            if (!currentGuess.includes(keys[i])) {
                flag = true;
            }
        }
        if (flag) {
            toastr.error('In hard mode, any revealed hint must be used!');
            animateCSS(row, 'flash');
            return;
        }
    }
    // Check the guess is a valid word (in dictionary)
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

// Update a letter state in the keyboard
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

// Restores a game state previusly saved in local storage
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

// Get the game state from local storage or creates a initial one
function getWordleState() {
    if (typeof (Storage) !== 'undefined') {
        return JSON.parse(localStorage.getItem('wordle-state')) ||
        {
            boardState: ['', '', '', '', '', ''],
            evaluations: [null, null, null, null, null, null],
            gameStatus: '',
            rowIndex: 0,
            solution: ''
        }
    }
}

// Store the game state to local storage
function storeWordleState() {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('wordle-state', JSON.stringify(wordleState));
    }
}

// Get the game statistics from local storage or creates a initial one
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

// Store the game statistics to local storage
function storeWordleStats() {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('wordle-stats', JSON.stringify(wordleStats));
    }
}

// Calculate an average of guesses
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

// Get the game settings from local storage or creates a initial one
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

// Store the game settings to local storage
function storeWordleSettings(wordleSettings) {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('wordle-settings', JSON.stringify(wordleSettings));
    }
}

// NAV BAR ACTIONS

// Use msgbox to display a modal about dialog
function showAbout() {
    let html = `
        <div id="about-container">
            <p>© Copyright 2022 by Erick Levy!</p>
            <p>Inspired on Josh Wardle game and based on Paul Akinyemi\'s article on freeCodeCamp "How to Build a Wordle Clone in JavaScript".</p>
            <p>Thank you for taking the time to learn about and play with this little app.</p>
            <h5>Other Games</h5>
            <p>There are other games and Apps I was implemented and published. If you want to take a look at them,
            here are the links: </p>
            <ul>
                <li><a href="../switcher/"><i class="switcher"></i>The Switcher Game</a></li>
                <li><a href="../tileslider/"><i class="tileslider"></i>The Tile Slider</a></li>
                <li><a href="../wordsearch/"><i class="wordle"></i>Word Search</a></li>
                <li><a href="../memorama/"><i class="memorama"></i>Memorama</a></li>
                <li><a href="../pokedex/"><i class="pokedex"></i>Pokedex (not a game)</a></li>
            </ul>
        </div>
    `;
    msgbox('About This Game', html);
}

// Use msgbox to display a modal help dialog
function showHelp() {
    let msg = `
        <div id="help-container">
            <h5>HOW TO PLAY</h5>
            <p>Guess the word in six tries or less.</p>
            <p>Each guess must be a valid five-letter word.</p>
            <p>Use the Enter key to evaluate the word or Backspace key to make corrections.</p>
            <p>With each guess, the color of the tiles and keys will change to show how close your guess was to the right word.</p>
            <p><span class="sample correct">C</span>: letter is in the correct spot.<br>
            <span class="sample present">P</span>: letter is in the word but in the wrong spot.<br>
            <span class="sample absent">A</span>: letter is not in the word in any spot.</p>
        </div>
    `;
    msgbox('', msg);
}

// Use msgbox to display a modal statistics dialog
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

// Use msgbox to display a modal settings dialog
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
                    <div class="switch" id="hard-mode" name="hard-mode" ${wordleSettings.hardMode ? 'checked' : ''}>
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
    // Event listener for changes in the settings controls
    document.getElementById('settings-container').addEventListener('click', (e) => {
        let target = e.target;
        let name = target.getAttribute('name');
        let checked = (target.getAttribute('checked') == null);
        if (name == 'hard-mode') {
            wordleSettings.hardMode = checked;
            if (checked) {
                target.setAttribute('checked', '');
            } else {
                target.removeAttribute('checked');
            }
        }
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

// Initializes the navigation bars buttons
function initNavBar() {
    document.getElementById('button-menu').addEventListener('click', showAbout);
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