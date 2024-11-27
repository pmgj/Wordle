package sockets;

import model.MoveResult;
import model.Player;
import model.Wordle;

public record Message(ConnectionType type, Wordle game, Player turn, MoveResult result) {

}