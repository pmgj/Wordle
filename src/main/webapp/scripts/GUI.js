class GUI {
    constructor() {
        let tBodies = document.querySelectorAll("tbody");
        this.wordle = [];
        for (const table of tBodies) {
            this.wordle.push({ game: new Wordle(words, 6), row: 0, col: 0, currentWord: "", tbody: table, isOver: false });
        }
    }
    showWord(mr, tabindex) {
        let endOfGame = () => {
            this.wordle[tabindex].col = 0;
            this.wordle[tabindex].currentWord = "";
            this.wordle[tabindex].row++;
            if (mr.winner === Winner.WIN) {
                let j = 1, td = this.wordle[tabindex].tbody.rows[this.wordle[tabindex].row - 1].cells[0];
                let endanim = cell => {
                    cell.dataset.animation = "bounce";
                    if (cell.nextSibling) {
                        setTimeout(() => endanim(cell.nextSibling), j++ * 100);
                    }
                };
                endanim(td);
                this.wordle[tabindex].isOver = true;
            }
            if (this.wordle.every(w => w.isOver)) {
                window.onkeyup = undefined;
                message.textContent = "Congratulations!";
                message.className = "bg-success text-white";
            } else if (mr.winner === Winner.LOSE) {
                window.onkeyup = undefined;
                message.textContent = `You lose! ${this.wordle.map(mr => mr.game.secret.toUpperCase())}`;
                message.className = "bg-secondary text-white";
            }
        };
        let styleKeyboard = () => {
            for (let i = 0; i < mr.hint.length; i++) {
                let index = mr.hint[i];
                let letter = this.wordle[tabindex].currentWord[i];
                let b = document.querySelector(`button[data-value='${letter}']`);
                let bStyles = ["btn-secondary", "btn-warning", "btn-success"];
                if (bStyles.indexOf(b.dataset[`color${tabindex}`]) < bStyles.indexOf(bStyles[index])) {
                    b.classList.remove(b.dataset[`color${tabindex}`]);
                    b.dataset[`color${tabindex}`] = bStyles[index];
                }
                if (b.dataset.color0) {
                    b.classList.remove("bg-secondary-subtle");
                    b.classList.add("text-white");
                    b.classList.add(b.dataset[`color${tabindex}`]);
                }
            }
            endOfGame();
        };
        let animation = cell => {
            let styles = ["secondary", "warning", "success"]
            cell.dataset.animation = "flip-in";
            cell.onanimationend = () => {
                cell.dataset.animation = "flip-out";
                cell.classList.add("text-white");
                cell.classList.add(`bg-${styles[mr.hint[cell.cellIndex]]}`);
                cell.classList.add(`border-${styles[mr.hint[cell.cellIndex]]}`);
                cell.onanimationend = () => {
                    cell.onanimationend = undefined;
                    if (cell.nextSibling) {
                        animation(cell.nextSibling);
                    } else {
                        styleKeyboard();
                    }
                };
            };
        };
        let td = this.wordle[tabindex].tbody.rows[this.wordle[tabindex].row].cells[0];
        animation(td);
    }
    checkWord() {
        for (let i = 0; i < this.wordle.length; i++) {
            try {
                if (this.wordle[i].isOver) continue;
                let temp = this.wordle[i].game.check(this.wordle[i].currentWord);
                this.showWord(temp, i);
            } catch (ex) {
                if (ex instanceof NotInWordListError) {
                    let tr = this.wordle[i].tbody.rows[this.wordle[i].row];
                    for (let j = 0; j < tr.cells.length; j++) {
                        tr.cells[j].dataset.animation = "shake";
                        tr.cells[j].onanimationend = () => {
                            tr.cells[j].dataset.animation = "";
                        };
                    }
                }
            }
        }
    }
    removeLetter() {
        for (let i = 0; i < this.wordle.length; i++) {
            let temp = this.wordle[i];
            if (temp.col === 0) {
                continue;
            }
            temp.currentWord = temp.currentWord.slice(0, -1);
            temp.col--;
            if (!temp.isOver) {
                let td = temp.tbody.rows[temp.row].cells[temp.col];
                td.textContent = "";
                td.dataset.animation = "";
            }
        }
    }
    addLetter(letter) {
        for (let i = 0; i < this.wordle.length; i++) {
            let temp = this.wordle[i];
            if (temp.currentWord.length >= temp.game.wordLength) {
                return;
            }
            if (!temp.isOver) {
                let td = temp.tbody.rows[temp.row].cells[temp.col];
                td.textContent = letter;
                td.dataset.animation = "pop";
                temp.currentWord += letter;
                temp.col++;
            }
        }
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
    keyPressed(evt) {
        this.process(evt.key);
    }
    buttonPressed(evt) {
        this.process(evt.currentTarget.dataset.value);
    }
    fillBoard() {
        for (let i = 0; i < this.wordle.length; i++) {
            const element = this.wordle[i];
            let rows = "";
            for (let i = 0; i < element.game.maxTries; i++) {
                rows += "<tr>";
                for (let j = 0; j < element.game.wordLength; j++) {
                    rows += "<td></td>";
                }
                rows += "</tr>";
            }
            element.tbody.innerHTML = rows;
        }
    }
    registerEvents() {
        this.fillBoard();
        window.onkeyup = this.keyPressed.bind(this);
        let buttons = document.querySelectorAll("button");
        buttons.forEach(b => b.onclick = this.buttonPressed.bind(this));
    }
}
let gui = new GUI();
gui.registerEvents();