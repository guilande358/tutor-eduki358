import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Capacitor } from "@capacitor/core";

interface MediaState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isRecording: boolean;
  recordedBlob: Blob | null;
}

export const useMediaDevices = () => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isVideoEnabled: false,
    isAudioEnabled: false,
    isRecording: false,
    recordedBlob: null,
  });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState<{
    video: boolean;
    audio: boolean;
  }>({ video: false, audio: false });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();

  const checkPermissions = async () => {
    try {
      const videoPermission = await navigator.permissions.query({ name: "camera" as PermissionName });
      const audioPermission = await navigator.permissions.query({ name: "microphone" as PermissionName });
      
      setHasPermissions({
        video: videoPermission.state === "granted",
        audio: audioPermission.state === "granted",
      });
    } catch (error) {
      // Permissions API not fully supported (common in native apps)
      console.log("Permissions API not supported:", error);
    }
  };

  useEffect(() => {
    checkPermissions();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const getPermissionErrorMessage = (errorName: string): string => {
    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
      return isNative 
        ? "Ative câmera e microfone nas configurações do app para usar a Sala de Estudo."
        : "Permissão negada. Habilite nas configurações do navegador.";
    }
    if (errorName === "NotFoundError") {
      return "Câmera não encontrada neste dispositivo.";
    }
    if (errorName === "NotReadableError") {
      return "Câmera está sendo usada por outro aplicativo.";
    }
    return "Não foi possível acessar a câmera.";
  };

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      setStream(mediaStream);
      setMediaState(prev => ({ ...prev, isVideoEnabled: true }));
      setHasPermissions(prev => ({ ...prev, video: true }));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      toast({
        title: "Câmera ativada! 📹",
        description: "Você está visível para os outros participantes",
      });

      return mediaStream;
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Erro ao acessar câmera",
        description: getPermissionErrorMessage(error.name),
        variant: "destructive",
        duration: 6000,
      });
      return null;
    }
  }, [toast, isNative]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.stop());
    }
    setMediaState(prev => ({ ...prev, isVideoEnabled: false }));
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const toggleCamera = useCallback(async () => {
    if (mediaState.isVideoEnabled) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [mediaState.isVideoEnabled, startCamera, stopCamera]);

  const getMicPermissionErrorMessage = (errorName: string): string => {
    if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
      return isNative 
        ? "Ative câmera e microfone nas configurações do app para usar a Sala de Estudo."
        : "Permissão negada. Habilite nas configurações do navegador.";
    }
    if (errorName === "NotFoundError") {
      return "Microfone não encontrado neste dispositivo.";
    }
    if (errorName === "NotReadableError") {
      return "Microfone está sendo usado por outro aplicativo.";
    }
    return "Não foi possível acessar o microfone.";
  };

  const startMicrophone = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });

      // Merge with existing stream or create new
      if (stream) {
        audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
      } else {
        setStream(audioStream);
      }

      setMediaState(prev => ({ ...prev, isAudioEnabled: true }));
      setHasPermissions(prev => ({ ...prev, audio: true }));

      toast({
        title: "Microfone ativado! 🎤",
        description: "Os outros participantes podem te ouvir",
      });

      return audioStream;
    } catch (error: any) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Erro ao acessar microfone",
        description: getMicPermissionErrorMessage(error.name),
        variant: "destructive",
        duration: 6000,
      });
      return null;
    }
  }, [stream, toast, isNative]);

  const stopMicrophone = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.stop());
    }
    setMediaState(prev => ({ ...prev, isAudioEnabled: false }));
  }, [stream]);

  const toggleMicrophone = useCallback(async () => {
    if (mediaState.isAudioEnabled) {
      stopMicrophone();
    } else {
      await startMicrophone();
    }
  }, [mediaState.isAudioEnabled, startMicrophone, stopMicrophone]);

  const startRecording = useCallback(async () => {
    let recordingStream = stream;

    // Ensure we have audio for recording
    if (!recordingStream?.getAudioTracks().length) {
      recordingStream = await startMicrophone();
      if (!recordingStream) return;
    }

    try {
      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        setMediaState(prev => ({ ...prev, recordedBlob: blob, isRecording: false }));
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setMediaState(prev => ({ ...prev, isRecording: true }));

      toast({
        title: "Gravação iniciada! 🎙️",
        description: "Grave sua mensagem de voz",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Erro ao gravar",
        description: "Não foi possível iniciar a gravação",
        variant: "destructive",
      });
    }
  }, [stream, startMicrophone, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      toast({
        title: "Gravação finalizada! ✓",
        description: "Sua mensagem está pronta para enviar",
      });
    }
  }, [toast]);

  const clearRecording = useCallback(() => {
    setMediaState(prev => ({ ...prev, recordedBlob: null }));
    chunksRef.current = [];
  }, []);

  const getAudioLevel = useCallback(() => {
    if (!stream || !mediaState.isAudioEnabled) return 0;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return average / 255;
  }, [stream, mediaState.isAudioEnabled]);

  return {
    mediaState,
    stream,
    hasPermissions,
    videoRef,
    startCamera,
    stopCamera,
    toggleCamera,
    startMicrophone,
    stopMicrophone,
    toggleMicrophone,
    startRecording,
    stopRecording,
    clearRecording,
    getAudioLevel,
  };
};
