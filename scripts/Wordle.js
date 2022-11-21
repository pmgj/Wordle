import Winner from "./Winner.js";
import MoveResult from "./MoveResult.js";
import NotInWordListError from "./NotInWordListError.js";

export default class Wordle {
    constructor(words) {
        this.words = words;
        this.secret = words[Math.floor(Math.random() * words.length)];
        this.tries = 0;
        this.maxTries = 6;
        this.wordLength = this.secret.length;
    }
    check(value) {
        if (value.length !== this.secret.length) {
            throw new Error(`The length of the word is incorrect. Must be ${this.secret.length}.`);
        }
        if (this.tries > this.maxTries) {
            throw new Error("You have no more tries.");
        }
        if (!this.words.includes(value)) {
            throw new NotInWordListError();
        }
        let result = [];
        for (let i = 0; i < this.secret.length; i++) {
            let number = value[i];
            result.push(!this.secret.includes(number) ? 0 : number === this.secret[i] ? 2 : 1);
        }
        this.tries++;
        if (result.every(e => e === 2)) {
            return new MoveResult(Winner.WIN, this.secret, result);
        }
        if (this.tries === this.maxTries) {
            return new MoveResult(Winner.LOSE, this.secret, result);
        }
        return new MoveResult(Winner.NONE, null, result);
    }
}