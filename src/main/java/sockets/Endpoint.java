package sockets;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

import jakarta.json.bind.JsonbBuilder;
import jakarta.websocket.CloseReason;
import jakarta.websocket.EncodeException;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import model.MoveResult;
import model.Player;
import model.Winner;
import model.Wordle;

@ServerEndpoint(value = "/wordle", encoders = MessageEncoder.class)
public class Endpoint {

    private static Session s1;
    private static Session s2;
    private static Wordle game1;
    private static Wordle game2;

    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {
        String content = new String(getClass().getClassLoader().getResourceAsStream("words_en.js").readAllBytes());
        String[] array = JsonbBuilder.create().fromJson(content, String[].class);
        int tries = 6;
        List<String> list = List.of(array);
        if (s1 == null) {
            s1 = session;
            game1 = new Wordle(list, tries);
            s1.getBasicRemote().sendObject(new Message(ConnectionType.OPEN, Player.PLAYER1, null));
        } else if (s2 == null) {
            s2 = session;
            game2 = new Wordle(list, tries);
            s2.getBasicRemote().sendObject(new Message(ConnectionType.OPEN, Player.PLAYER2, null));
            sendMessage(new Message(ConnectionType.MESSAGE, null, null));
        } else {
            session.close();
        }
    }

    @OnMessage
    public void onMessage(Session session, String word) throws IOException, EncodeException {
        MoveResult ret;
        Player turn;
        try {
            if (s1 == session) {
                ret = game1.check(word);
                turn = Player.PLAYER1;
            } else if (s2 == session) {
                ret = game2.check(word);
                turn = Player.PLAYER2;
            } else {
                session.close();
                return;
            }
            if (ret.winner() == Winner.NONE) {
                sendMessage(new Message(ConnectionType.MESSAGE, turn, ret));
            } else {
                sendMessage(new Message(ConnectionType.ENDGAME, turn, ret));
            }
        } catch (Exception ex) {
            System.out.println(ex.getMessage());
        }
    }

    @OnClose
    public void onClose(Session session, CloseReason reason) throws IOException, EncodeException {
        switch (reason.getCloseCode().getCode()) {
            case 4000 -> {
                if (session == s1) {
                    s1 = null;
                } else {
                    s2 = null;
                }
            }
            case 1001, 4001 -> {
                if (session == s1) {
                    s2.getBasicRemote()
                            .sendObject(new Message(ConnectionType.ENDGAME, Player.PLAYER2, null));
                    s1 = null;
                } else {
                    s1.getBasicRemote()
                            .sendObject(new Message(ConnectionType.ENDGAME, Player.PLAYER1, null));
                    s2 = null;
                }
            }
            default -> {
                System.out.println(String.format("Close code %d incorrect", reason.getCloseCode().getCode()));
            }
        }
    }

    private void sendMessage(Message msg) throws EncodeException, IOException {
        s1.getBasicRemote().sendObject(msg);
        s2.getBasicRemote().sendObject(msg);
    }
}