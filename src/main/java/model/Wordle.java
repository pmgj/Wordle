package model;

import java.util.Arrays;
import java.util.List;
import java.util.stream.IntStream;

public class Wordle {
    private List<String> words;
    private String secret;
    private int tries;
    private int maxTries;
    private int wordLength;

    public Wordle(List<String> words, int tries) {
        this.words = words;
        this.secret = words.get((int) Math.floor(Math.random() * words.size()));
        this.tries = 0;
        this.maxTries = tries;
        this.wordLength = this.secret.length();
    }

    public MoveResult check(String value) throws Exception {
        if (value.length() != this.secret.length()) {
            throw new Exception(
                    String.format("The length of the word is incorrect. Must be %d.", this.secret.length()));
        }
        if (this.tries > this.maxTries) {
            throw new Exception("You have no more tries.");
        }
        if (!this.words.contains(value)) {
            throw new Exception();
        }

        int[] result = new int[this.wordLength];
        Arrays.fill(result, -1);
        for (int i = 0; i < this.secret.length(); i++) {
            char number = value.charAt(i);
            if (!this.secret.contains("" + number)) {
                result[i] = 0;
            } else if (number == this.secret.charAt(i)) {
                result[i] = 2;
            }
        }
        for (int i = 0; i < result.length; i++) {
            if (result[i] == -1) {
                final int x = i;
                long v1 = this.secret.chars().filter(v -> v == value.charAt(x)).count();
                long v2 = value.chars().filter(v -> v == value.charAt(x)).count();
                if (v1 >= v2) {
                    result[i] = 1;
                } else {
                    int index = value.indexOf(value.charAt(i), i + 1);
                    if (index != -1 && result[index] == -1) {
                        result[i] = 1;
                    } else {
                        result[i] = 0;
                    }
                }
            }
        }
        this.tries++;
        if (IntStream.of(result).allMatch(e -> e == 2)) {
            return new MoveResult(Winner.WIN, this.secret, result);
        }
        if (this.tries == this.maxTries) {
            return new MoveResult(Winner.LOSE, this.secret, result);
        }
        return new MoveResult(Winner.NONE, null, result);
    }
}