package com.cdac.gd.controller;

import com.cdac.gd.model.SignalMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/signal")
    public void handleSignal(@Payload SignalMessage message) {
        // If receiver is specified, send to specific user (not implemented here for
        // simplicity, broadcasting to session topic)
        // In a real app, you'd use convertAndSendToUser or filter on client side.
        // For this implementation, we'll broadcast to the session topic and clients
        // will filter by receiver.

        messagingTemplate.convertAndSend("/topic/session/" + message.getSessionId(), message);
    }
}
