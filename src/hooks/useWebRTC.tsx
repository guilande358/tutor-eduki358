import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface UseWebRTCProps {
  roomId: string;
  userId: string;
  localStream: MediaStream | null;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const useWebRTC = ({ roomId, userId, localStream }: UseWebRTCProps) => {
  const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peersRef = useRef<Map<string, PeerConnection>>(new Map());

  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Adicionar tracks locais
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    // Receber tracks remotos
    pc.ontrack = (event) => {
      console.log('Received remote track from', peerId);
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => new Map(prev).set(peerId, remoteStream));
    };

    // ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await supabase.from('webrtc_signals').insert([{
          room_id: roomId,
          from_user_id: userId,
          to_user_id: peerId,
          signal_type: 'ice-candidate',
          signal_data: event.candidate.toJSON() as any,
        }]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        // Remover peer desconectado
        setRemoteStreams(prev => {
          const updated = new Map(prev);
          updated.delete(peerId);
          return updated;
        });
      }
    };

    return pc;
  }, [localStream, roomId, userId]);

  const initiateCall = useCallback(async (peerId: string) => {
    if (peersRef.current.has(peerId)) return;

    console.log('Initiating call to', peerId);
    const pc = createPeerConnection(peerId);
    peersRef.current.set(peerId, { peerId, connection: pc });
    setPeers(new Map(peersRef.current));

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('webrtc_signals').insert([{
        room_id: roomId,
        from_user_id: userId,
        to_user_id: peerId,
        signal_type: 'offer',
        signal_data: { type: offer.type, sdp: offer.sdp } as any,
      }]);
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  }, [createPeerConnection, roomId, userId]);

  const handleOffer = useCallback(async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
    console.log('Received offer from', fromUserId);
    
    let pc = peersRef.current.get(fromUserId)?.connection;
    if (!pc) {
      pc = createPeerConnection(fromUserId);
      peersRef.current.set(fromUserId, { peerId: fromUserId, connection: pc });
      setPeers(new Map(peersRef.current));
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await supabase.from('webrtc_signals').insert([{
        room_id: roomId,
        from_user_id: userId,
        to_user_id: fromUserId,
        signal_type: 'answer',
        signal_data: { type: answer.type, sdp: answer.sdp } as any,
      }]);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, roomId, userId]);

  const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    console.log('Received answer from', fromUserId);
    const peer = peersRef.current.get(fromUserId);
    if (peer?.connection) {
      try {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    const peer = peersRef.current.get(fromUserId);
    if (peer?.connection) {
      try {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  // Escutar sinais WebRTC via Supabase Realtime
  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase
      .channel(`webrtc-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const signal = payload.new as any;
          if (signal.room_id !== roomId) return;

          const { from_user_id, signal_type, signal_data } = signal;

          switch (signal_type) {
            case 'offer':
              handleOffer(from_user_id, signal_data);
              break;
            case 'answer':
              handleAnswer(from_user_id, signal_data);
              break;
            case 'ice-candidate':
              handleIceCandidate(from_user_id, signal_data);
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, handleOffer, handleAnswer, handleIceCandidate]);

  // Conectar a participantes existentes
  const connectToParticipants = useCallback(async (participantIds: string[]) => {
    for (const peerId of participantIds) {
      if (peerId !== userId && !peersRef.current.has(peerId)) {
        // User com menor ID inicia a chamada (evita duplicação)
        if (userId < peerId) {
          await initiateCall(peerId);
        }
      }
    }
  }, [userId, initiateCall]);

  // Cleanup
  const disconnect = useCallback(() => {
    peersRef.current.forEach(({ connection }) => {
      connection.close();
    });
    peersRef.current.clear();
    setPeers(new Map());
    setRemoteStreams(new Map());

    // Limpar sinais antigos
    supabase.from('webrtc_signals')
      .delete()
      .eq('from_user_id', userId)
      .then(() => console.log('Cleaned up WebRTC signals'));
  }, [userId]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    peers,
    remoteStreams,
    connectToParticipants,
    initiateCall,
    disconnect,
  };
};
