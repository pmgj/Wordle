export default class MoveResult {
    constructor(winner, code, hint) {
        this.code = code;
        this.winner = winner;
        this.hint = hint;
    }
    getCode() {
        return this.code;
    }
    getHint() {
        return this.hint;
    }
    getWinner() {
        return this.winner;
    }
}