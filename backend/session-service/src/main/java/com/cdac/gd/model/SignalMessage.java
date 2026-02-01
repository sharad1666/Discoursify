package com.cdac.gd.model;

import lombok.Data;

@Data
public class SignalMessage {
    private String type; // "offer", "answer", "candidate", "join", "leave"
    private String sender;
    private String receiver;
    private String data; // SDP or Candidate JSON
    private String sessionId;
}
