package sockets;

import model.MoveResult;
import model.Player;

public record Message(ConnectionType type, Player turn, MoveResult result) {

}