import words from "./words_en.js";
import Wordle from "./Wordle.js";
import Winner from "./Winner.js";
import NotInWordListError from "./NotInWordListError.js";

class GUI {
    constructor() {
        this.currentRow = 0;
        this.currentCol = 0;
        this.currentWord = "";
        this.wordle = new Wordle(words);
        this.tbody = document.querySelector("tbody");
    }
    keyPressed(evt) {
        this.process(evt.key);
    }
    process(key) {
        switch (key) {
            case "Enter":
                this.checkWord();
                break;
            case "Backspace":
                this.removeLetter();
                break;
            default:
                if (key >= 'a' && key <= 'z')
                    this.addLetter(key);
        }
    }
    checkWord() {
        let mr;
        try {
            mr = this.wordle.check(this.currentWord);
            this.showWord(mr);
        } catch (ex) {
            if (ex instanceof NotInWordListError) {
                let tr = this.tbody.rows[this.currentRow];
                for (let i = 0; i < tr.cells.length; i++) {
                    tr.cells[i].dataset.animation = "shake";
                }
            }
        }
    }
    showWord(mr) {
        let styles = ["absent", "present", "correct"];
        let endOfGame = () => {
            this.currentRow++;
            this.currentCol = 0;
            this.currentWord = "";
            let message = document.querySelector("#message");
            switch (mr.winner) {
                case Winner.WIN:
                    window.onkeyup = undefined;
                    message.textContent = "Congratulations!";
                    message.className = "correct";
                    message.style.visibility = "visible";
                    let i = 1, td = this.tbody.rows[this.currentRow - 1].cells[0];
                    let endanim = cell => {
                        cell.dataset.animation = "bounce";
                        if (cell.nextSibling) {
                            setTimeout(() => endanim(cell.nextSibling), i++ * 150);
                        }
                    };
                    endanim(td);
                    break;
                case Winner.LOSE:
                    window.onkeyup = undefined;
                    message.textContent = `You lose! Correct word: ${mr.code}`;
                    message.className = "absent";
                    message.style.visibility = "visible";
                    break;
            }
        };
        let styleKeyboard = () => {
            for (let i = 0; i < mr.hint.length; i++) {
                let index = mr.hint[i];
                let letter = this.currentWord[i].toLowerCase();
                let b = document.querySelector(`button[data-value='${letter}']`);
                b.className = styles[index];
                let td = this.tbody.rows[this.currentRow].cells[i];
                td.onanimationend = undefined;
            }
            endOfGame();
        };
        let animation = cell => {
            cell.dataset.animation = "flip-in";
            cell.onanimationend = () => {
                cell.dataset.animation = "flip-out";
                cell.className = styles[mr.hint[cell.cellIndex]];
                cell.onanimationend = () => {
                    if (cell.nextSibling) {
                        animation(cell.nextSibling);
                    } else {
                        styleKeyboard();
                    }
                };
            };
        };
        let td = this.tbody.rows[this.currentRow].cells[0];
        animation(td);
    }
    removeLetter() {
        if (this.currentCol === 0) {
            return;
        }
        this.currentWord = this.currentWord.slice(0, -1);
        this.currentCol--;
        let td = this.tbody.rows[this.currentRow].cells[this.currentCol];
        td.textContent = "";
        td.dataset.animation = "";
    }
    addLetter(letter) {
        if (this.currentWord.length >= this.wordle.wordLength) {
            return;
        }
        this.currentWord += letter;
        let td = this.tbody.rows[this.currentRow].cells[this.currentCol];
        td.textContent = letter;
        td.dataset.animation = "pop";
        this.currentCol++;
    }
    buttonPressed(evt) {
        this.process(evt.currentTarget.dataset.value);
    }
    registerEvents() {
        let rows = "";
        for (let i = 0; i < this.wordle.maxTries; i++) {
            rows += "<tr>";
            for (let j = 0; j < this.wordle.wordLength; j++) {
                rows += "<td></td>";
            }
            rows += "</tr>";
        }
        this.tbody.innerHTML = rows;
        window.onkeyup = this.keyPressed.bind(this);
        let buttons = document.querySelectorAll("button");
        buttons.forEach(b => b.onclick = this.buttonPressed.bind(this));
        console.log(this.wordle.secret);
    }
}
let gui = new GUI();
gui.registerEvents();