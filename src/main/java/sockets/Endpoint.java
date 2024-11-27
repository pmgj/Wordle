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
    private static Wordle game;

    @OnOpen
    public void onOpen(Session session) throws IOException, EncodeException {
        if (s1 == null) {
            s1 = session;
            s1.getBasicRemote().sendObject(new Message(ConnectionType.OPEN, game, Player.PLAYER1, null));
        } else if (s2 == null) {
            s2 = session;
            String content = new String(Files.readAllBytes(Paths.get("src\\main\\java\\resources\\words_en.js")));
            String[] array = JsonbBuilder.create().fromJson(content, String[].class);
            List<String> list = List.of(array);
            game = new Wordle(list, 6);
            s2.getBasicRemote().sendObject(new Message(ConnectionType.OPEN, game, Player.PLAYER2, null));
            sendMessage(new Message(ConnectionType.MESSAGE, game, null, null));
        } else {
            session.close();
        }
    }

    @OnMessage
    public void onMessage(Session session, String word) throws IOException, EncodeException {
        try {
            MoveResult ret = game.check(session == s1 ? Player.PLAYER1 : Player.PLAYER2, word);
            if (ret.winner() == Winner.NONE) {
                sendMessage(new Message(ConnectionType.MESSAGE, game, null, ret));
            } else {
                sendMessage(new Message(ConnectionType.ENDGAME, game, null, ret));
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
                            .sendObject(new Message(ConnectionType.ENDGAME, game, null, null));
                    s1 = null;
                } else {
                    s1.getBasicRemote()
                            .sendObject(new Message(ConnectionType.ENDGAME, game, null, null));
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