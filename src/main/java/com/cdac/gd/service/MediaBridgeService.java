package com.cdac.gd.service;

import org.springframework.stereotype.Service;

@Service
public class MediaBridgeService {

    // Placeholder for WebRTC / SFU integration (LiveKit/Janus)
    // This service would handle room creation, token generation, etc.

    public String createRoom(String roomId) {
        // Logic to create room in SFU
        return "Room " + roomId + " created";
    }

    public String generateToken(String roomId, String userId) {
        // Logic to generate join token
        return "mock-token-for-" + roomId + "-" + userId;
    }
}
