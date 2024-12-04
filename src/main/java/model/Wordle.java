package model;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.Scanner;
import java.util.function.BiConsumer;
import java.util.stream.IntStream;

import jakarta.json.bind.JsonbBuilder;

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

    public String getSecret() {
        return secret;
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
            throw new NotInWordListException(value);
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

    public static void main(String[] args) {
        final String ANSI_RESET = "\u001B[0m";
        final String ANSI_RED = "\u001B[31m";
        final String ANSI_GREEN = "\u001B[32m";
        final String ANSI_YELLOW = "\u001B[33m";
        final String ANSI_GRAY = "\u001B[90m";
        BiConsumer<String, String> print = (s, color) -> {
            System.out.print(color + s + ANSI_RESET);
        };
        BiConsumer<int[], String> showHint = (hint, word) -> {
            for (int i = 0; i < hint.length; i++) {
                int c = hint[i];
                switch (c) {
                    case 0:
                        print.accept(String.format("%c", word.charAt(i)), ANSI_GRAY);
                        break;
                    case 1:
                        print.accept(String.format("%c", word.charAt(i)), ANSI_YELLOW);
                        break;
                    case 2:
                        print.accept(String.format("%c", word.charAt(i)), ANSI_GREEN);
                        break;
                    default:
                        System.out.println("Erro!");
                        break;
                }
            }
            System.out.println();
        };
        try {
            InputStream is = Wordle.class.getClassLoader().getResourceAsStream("words_en.js");
            String content = new String(is.readAllBytes());
            System.out.println(content);
            String[] array = JsonbBuilder.create().fromJson(content, String[].class);
            List<String> list = List.of(array);
            int tries = 6;
            Scanner sc = new Scanner(System.in);
            Wordle w = new Wordle(list, tries);
            for (int i = 0; i < tries; i++) {
                String word = sc.nextLine();
                try {
                    MoveResult mr = w.check(word);
                    System.out.println(mr);
                    switch (mr.winner()) {
                        case WIN:
                            print.accept("You win!", ANSI_GREEN);
                            break;
                        case LOSE:
                            print.accept("You lose!", ANSI_RED);
                            print.accept(mr.code(), ANSI_RED);
                            break;
                        default:
                            showHint.accept(mr.hint(), word);
                            break;
                    }
                } catch (Exception ex) {
                    i--;
                    System.out.println(ex.getMessage());
                }
            }
            sc.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}