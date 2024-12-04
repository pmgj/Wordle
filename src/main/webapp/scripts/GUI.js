import Winner from "./Winner.js";

class GUI {
    constructor() {
        this.ws = null;
        this.player = null;
        this.closeCodes = { ENDGAME: { code: 4000, description: "End of game." }, ADVERSARY_QUIT: { code: 4001, description: "The opponent quit the game" } };
        this.createGames();
    }
    createGames() {
        let tBodies = document.querySelectorAll("tbody");
        this.wordle = [];
        for (const table of tBodies) {
            this.wordle.push({ currentWord: "", tbody: table, row: 0, col: 0 });
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
            }
            if (mr.winner === Winner.WIN) {
                window.onkeyup = undefined;
                message.textContent = "Congratulations!";
                message.className = "bg-success text-white";
                this.createGames();
            } else if (mr.winner === Winner.LOSE) {
                window.onkeyup = undefined;
                message.textContent = `You lose! ${mr.code.toUpperCase()}`;
                message.className = "bg-secondary text-white";
                this.createGames();
            }
        };
        let styleKeyboard = () => {
            if (tabindex === 0) {
                endOfGame();
                return;
            }
            for (let i = 0; i < mr.hint.length; i++) {
                let index = mr.hint[i];
                let letter = this.wordle[tabindex].currentWord[i];
                let b = document.querySelector(`button[data-value='${letter}']`);
                let bStyles = ["btn-secondary", "btn-warning", "btn-success"];
                if (bStyles.indexOf(b.dataset[`color${tabindex}`]) < bStyles.indexOf(bStyles[index])) {
                    b.classList.remove(b.dataset[`color${tabindex}`]);
                    b.dataset[`color${tabindex}`] = bStyles[index];
                }
                if (b.dataset.color1) {
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
        try {
            this.showWord(temp, 1);
        } catch (ex) {
            console.log(ex);
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
    removeLetter() {
        let temp = this.wordle[1];
        if (temp.col === 0) {
            return;
        }
        temp.currentWord = temp.currentWord.slice(0, -1);
        temp.col--;
        let td = temp.tbody.rows[temp.row].cells[temp.col];
        td.textContent = "";
        td.dataset.animation = "";
    }
    addLetter(letter) {
        let temp = this.wordle[1];
        if (temp.currentWord.length >= 5) {
            return;
        }
        let td = temp.tbody.rows[temp.row].cells[temp.col];
        td.textContent = letter;
        td.dataset.animation = "pop";
        temp.currentWord += letter;
        temp.col++;
    }
    process(key) {
        switch (key) {
            case "Enter":
                this.ws.send(this.wordle[1].currentWord);
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
            for (let i = 0; i < 6; i++) {
                rows += "<tr>";
                for (let j = 0; j < 5; j++) {
                    rows += "<td></td>";
                }
                rows += "</tr>";
            }
            element.tbody.innerHTML = rows;
        }
    }
    setMessage(msg) {
        let message = document.getElementById("message");
        message.innerHTML = msg;
    }
    readData(evt) {
        let data = JSON.parse(evt.data);
        switch (data.type) {
            case "OPEN":
                /* Informando cor da peça do usuário atual */
                this.player = data.turn;
                this.setMessage("Waiting for opponent.");
                this.clearBoard();
                break;
            case "MESSAGE":
                this.setMessage("");
                /* Recebendo o tabuleiro modificado */
                if (data.result) {
                    let i = data.turn === this.player ? 1 : 0;
                    this.showWord(data.result, i);
                } else {
                    this.fillBoard();
                }
                break;
            case "ENDGAME":
                /* Fim do jogo */
                if (data.result) {
                    let i = data.turn === this.player ? 1 : 0;
                    this.showWord(data.result, i);
                    this.ws.close(this.closeCodes.ENDGAME.code, this.closeCodes.ENDGAME.description);
                    this.endGame(data.result.winner);
                } else {
                    this.ws.close(this.closeCodes.ENDGAME.code, this.closeCodes.ENDGAME.description);
                    this.endGame(this.player);
                }
                break;
        }
    }
    clearBoard() {
        let table = document.querySelectorAll("table#opBoard");
        table.innerHTML = "";
        table = document.querySelectorAll("table#myBoard");
        table.innerHTML = "";
    }
    endGame(type) {
        this.ws = null;
        this.setButtonText(true);
        this.setMessage(`Game Over! ${(type === "DRAW") ? "Draw!" : (type === this.player ? "You win!" : "You lose!")}`);
        this.unsetEvents();
    }
    setEvents() {
        window.onkeyup = this.keyPressed.bind(this);
        let buttons = document.querySelectorAll("button");
        buttons.forEach(b => {
            b.onclick = this.buttonPressed.bind(this);
            b.removeAttribute("data-color1");
            b.className = "btn bg-secondary-subtle";
        });
    }
    unsetEvents() {
        window.onkeyup = undefined;
        let buttons = document.querySelectorAll("button");
        buttons.forEach(b => b.onclick = undefined);
    }
    setButtonText(on) {
        let button = document.querySelector("input[type='button']");
        button.value = on ? "Start" : "Quit";
        button.blur();
    }
    startGame() {
        if (this.ws) {
            this.ws.close(this.closeCodes.ADVERSARY_QUIT.code, this.closeCodes.ADVERSARY_QUIT.description);
            this.endGame();
            this.createGames();
            this.fillBoard();
        } else {
            this.ws = new WebSocket("ws://" + document.location.host + document.location.pathname + "wordle");
            this.ws.onmessage = this.readData.bind(this);
            this.setButtonText(false);
            this.fillBoard();
            this.setMessage("");
            this.setEvents();
        }
    }
    registerEvents() {
        this.setEvents();
        let button = document.querySelector("input[type='button']");
        button.onclick = this.startGame.bind(this);
    }
}
let gui = new GUI();
gui.registerEvents();