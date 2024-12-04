package model;

public class NotInWordListException extends Exception {
    public NotInWordListException(String value) {
        super(String.format("Not in word list: %s.", value));
    }
}
