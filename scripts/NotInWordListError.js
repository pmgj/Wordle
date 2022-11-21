export default class NotInWordListError extends Error {
    constructor() {
        super("Not in word list.");
    }
}