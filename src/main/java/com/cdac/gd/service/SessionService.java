package com.cdac.gd.service;

import com.cdac.gd.model.Session;
import com.cdac.gd.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@org.springframework.transaction.annotation.Transactional
public class SessionService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private com.cdac.gd.repository.UserRepository userRepository;

    public Session createSession(Session session) {
        session.setStartTime(null);
        session.setStatus("SCHEDULED");
        Session savedSession = sessionRepository.save(session);

        // Update host's session count
        if (session.getHostEmail() != null) {
            userRepository.findByEmail(session.getHostEmail()).ifPresent(user -> {
                user.setSessionsCount(user.getSessionsCount() == null ? 1 : user.getSessionsCount() + 1);
                userRepository.save(user);
            });
        }

        return savedSession;
    }

    public Session getSession(UUID id) {
        return sessionRepository.findById(id).orElse(null);
    }

    public List<Session> getAllSessions() {
        return sessionRepository.findAll();
    }

    public Session getSessionByCode(String code) {
        return sessionRepository.findByCode(code).orElse(null);
    }

    public Session startSession(UUID id) {
        Session session = getSession(id);
        if (session != null) {
            session.setStatus("LIVE");
            if (session.getStartTime() == null) {
                session.setStartTime(LocalDateTime.now());
            }
            return sessionRepository.save(session);
        }
        return null;
    }



    public synchronized Session joinSession(UUID id, com.cdac.gd.model.Participant participant) {
        Session session = getSession(id);
        if (session != null) {
            // Check if already in participants or waiting list
            boolean alreadyJoined = session.getParticipants() != null &&
                    session.getParticipants().stream().anyMatch(p -> p.getEmail().equals(participant.getEmail()));

            boolean alreadyWaiting = session.getWaitingList() != null &&
                    session.getWaitingList().stream().anyMatch(p -> p.getEmail().equals(participant.getEmail()));

            if (alreadyJoined || alreadyWaiting) {
                return session;
            }

            participant.setJoinedAt(LocalDateTime.now());
            participant.setSpeakingTime(0L);

            // Check if waiting room is enabled and user is not host
            if (Boolean.TRUE.equals(session.getHasWaitingRoom()) && !participant.isHost()) {
                if (session.getWaitingList() == null) {
                    session.setWaitingList(new java.util.ArrayList<>());
                }
                session.getWaitingList().add(participant);
            } else {
                // Add to participants directly
                if (session.getParticipants() == null) {
                    session.setParticipants(new java.util.ArrayList<>());
                }
                session.getParticipants().add(participant);
                session.setParticipantsCount(session.getParticipants().size());

                // Update participant's stats only if actually joining
                if (participant.getEmail() != null) {
                    userRepository.findByEmail(participant.getEmail()).ifPresent(user -> {
                        user.setTotalParticipations(
                                user.getTotalParticipations() == null ? 1 : user.getTotalParticipations() + 1);
                        userRepository.save(user);
                    });
                }
            }

            return sessionRepository.save(session);
        }
        return null;
    }

    public Session admitParticipant(UUID sessionId, String participantId) {
        Session session = getSession(sessionId);
        if (session != null && session.getWaitingList() != null) {
            com.cdac.gd.model.Participant participant = session.getWaitingList().stream()
                    .filter(p -> p.getId().equals(participantId)
                            || (p.getEmail() != null && p.getEmail().equals(participantId))) // Support ID or Email
                                                                                             // lookup
                    .findFirst()
                    .orElse(null);

            if (participant != null) {
                // Remove from waiting list
                session.getWaitingList().remove(participant);

                // Add to participants
                if (session.getParticipants() == null) {
                    session.setParticipants(new java.util.ArrayList<>());
                }
                session.getParticipants().add(participant);
                session.setParticipantsCount(session.getParticipants().size());

                // Update participant's stats
                if (participant.getEmail() != null) {
                    userRepository.findByEmail(participant.getEmail()).ifPresent(user -> {
                        user.setTotalParticipations(
                                user.getTotalParticipations() == null ? 1 : user.getTotalParticipations() + 1);
                        userRepository.save(user);
                    });
                }

                return sessionRepository.save(session);
            }
        }
        return null;
    }

    public boolean deleteSession(UUID id) {
        if (sessionRepository.existsById(id)) {
            sessionRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public Session endSession(UUID id, List<String> transcript) {
        Session session = getSession(id);
        if (session != null) {
            session.setStatus("COMPLETED");
            session.setEndTime(LocalDateTime.now());
            session.setTranscript(transcript); // Save passed transcript

            // Save basic session info first
            session = sessionRepository.save(session);



            return sessionRepository.save(session);
        }
        return null;
    }


}
