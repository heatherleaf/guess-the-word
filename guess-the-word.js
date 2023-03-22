
window.addEventListener('DOMContentLoaded', initialize);

var DB;
var backDB;
var possibilities;

function initialize() {
    document.getElementById('numclues').addEventListener('change', calculate_possibilities);
    document.getElementById('minchars').addEventListener('change', calculate_possibilities);
    document.getElementById('maxchars').addEventListener('change', calculate_possibilities);
    document.getElementById('generatenew').addEventListener('click', generate_puzzle);
    document.getElementById('user-guess').addEventListener('input', check_user_guess);
    calculate_DB();
}

function topval(stack) {
    return stack[stack.length-1];
}

function expand(word, followers) {
    for (let follower of DB.get(word) || []) {
        followers.push(follower);
        expand(follower, followers);
    }
    return followers;
}

function check_user_guess() {
    let solution = document.getElementById('solution').innerText.trim().toLocaleLowerCase();
    let guess = document.getElementById('user-guess').value.trim().toLocaleLowerCase();
    let response = document.getElementById('response');
    response.classList.remove('correct');
    if (guess.length < 2) {
        response.innerText = "";
    } else if (guess === solution) {
        response.innerText = "Rätt svar!";
        response.classList.add('correct');
    } else {
        response.innerText = "Njae, inte riktigt rätt...";
    }
}

function calculate_DB() {
    DB = new Map();
    DB.set('', []);
    let stack = [''];
    let dictwords = DICT.trim().split(/\s+/);
    dictwords.sort();
    for (let word of dictwords) {
        word = word.toLowerCase();
        let prefix = topval(stack);
        while (!word.startsWith(prefix)) {
            stack.pop();
            prefix = topval(stack);
        }
        if (!DB.has(prefix)) DB.set(prefix, []);
        DB.get(prefix).push(word);
        stack.push(word);
    }
    DB.delete('');

    backDB = new Map();
    for (let word of DB.keys()) {
        for (let follower of expand(word, [])) {
            let cl = follower.slice(word.length);
            if (!backDB.has(cl)) backDB.set(cl, []);
            backDB.get(cl).push(word);
        }
    }
    calculate_possibilities();
}

function calculate_possibilities() {
    let minchars = +document.getElementById('minchars').value;
    let maxchars = +document.getElementById('maxchars').value;
    let numclues = +document.getElementById('numclues').value;

    possibilities = [];
    for (let word of DB.keys()) {
        if (word.length < minchars) continue;
        let cluelen = word.length + maxchars;
        let clues = [];
        for (let w of DB.get(word)) {
            if (w.length <= cluelen) {
                clues.push(w.slice(word.length));
            }
        }
        if (clues.length < numclues) continue;

        let alternatives = new Map();
        for (let cl of clues) {
            for (let w of backDB.get(cl) || []) {
                if (w !== word) {
                    if (!alternatives.has(w)) alternatives.set(w, []);
                    alternatives.get(w).push(cl);
                }
            }
        }

        let keep = true;
        for (let alts of alternatives.values()) {
            if (alts.length >= numclues) {
                keep = false;
                break;
            }
        }
        if (keep) {
            possibilities.push({word:word, clues:clues});
        }
    }
    document.getElementById('possibilities').innerText = possibilities.length;
    generate_puzzle();
}

function generate_puzzle() {
    if (!(possibilities && possibilities.length)) return;
    document.getElementById('show-solution').checked = false;

    let numclues = +document.getElementById('numclues').value;
    let solution = document.getElementById('solution');
    let clueslist = document.getElementById('clueslist');
    clueslist.innerHTML = "";

    let k = getRandomInt(possibilities.length);
    let puzzle = possibilities[k];
    let clues = puzzle.clues.slice();
    shuffle(clues);
    clues.splice(numclues);
    clues.sort();
    solution.innerText = puzzle.word;
    for (let cl of clues) {
        clueslist.innerHTML += `<li>${cl}</li>`
    }
    let guess = document.getElementById('user-guess')
    guess.value = "";
    guess.focus();
    check_user_guess();
}


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// Fisher–Yates shuffle: https://en.wikipedia.org/wiki/Fisher–Yates_shuffle
function shuffle(arr) {
    for (let i = arr.length-1; i > 0; i--) {
        let index = Math.floor((i + 1) * Math.random());
        [arr[i], arr[index]] = [arr[index], arr[i]];
    }
}
