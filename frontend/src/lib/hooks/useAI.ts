'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiService, ChatMessage, ChatRequest, VoiceRequest, BusinessQuery } from '../api/services/ai';
import { toast } from 'react-hot-toast';

// Chat management hook
export const useAIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => Date.now().toString());

  const sendMessageMutation = useMutation({
    mutationFn: (request: ChatRequest) => aiService.sendChatMessage({
      ...request,
      session_id: sessionId
    }),
    onSuccess: (response, variables) => {
      // Add user message first
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: variables.message,
        timestamp: new Date().toISOString(),
        language: variables.language
      };
      
      setMessages(prev => [...prev, userMessage, response]);
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  });

  const voiceMessageMutation = useMutation({
    mutationFn: (request: VoiceRequest) => aiService.sendVoiceMessage({
      ...request,
      session_id: sessionId
    }),
    onSuccess: (response) => {
      // Add transcription as user message and AI response
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: response.transcription,
        timestamp: new Date().toISOString(),
        language: response.response.language
      };
      
      setMessages(prev => [...prev, userMessage, response.response]);
    },
    onError: (error) => {
      console.error('Failed to send voice message:', error);
      toast.error('Failed to process voice message. Please try again.');
    }
  });

  const sendMessage = useCallback((message: string, language: 'english' | 'kannada' | 'hindi', context?: string) => {
    sendMessageMutation.mutate({
      message,
      language,
      context: context as any,
      session_id: sessionId
    });
  }, [sendMessageMutation, sessionId]);

  const sendVoiceMessage = useCallback((audioData: Blob, language: 'english' | 'kannada' | 'hindi') => {
    voiceMessageMutation.mutate({
      audio_data: audioData,
      language,
      session_id: sessionId
    });
  }, [voiceMessageMutation, sessionId]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    sendVoiceMessage,
    clearChat,
    isLoading: sendMessageMutation.isPending || voiceMessageMutation.isPending,
    error: sendMessageMutation.error || voiceMessageMutation.error
  };
};

// Get available AI models
export const useAIModels = () => {
  return useQuery({
    queryKey: ['aiModels'],
    queryFn: () => aiService.getAvailableModels(),
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
};

// Get supported languages
export const useSupportedLanguages = () => {
  return useQuery({
    queryKey: ['supportedLanguages'],
    queryFn: () => aiService.getSupportedLanguages(),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
};

// Business query hook
export const useBusinessQuery = () => {
  const [queryHistory, setQueryHistory] = useState<ChatMessage[]>([]);

  const businessQueryMutation = useMutation({
    mutationFn: (request: BusinessQuery) => aiService.queryBusinessData(request),
    onSuccess: (response, variables) => {
      // Add user query and AI response to history
      const userQuery: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: variables.query,
        timestamp: new Date().toISOString(),
        language: variables.language,
        metadata: {
          query_type: variables.type
        }
      };
      
      setQueryHistory(prev => [...prev, userQuery, response]);
    },
    onError: (error) => {
      console.error('Failed to execute business query:', error);
      toast.error('Failed to execute business query. Please try again.');
    }
  });

  const queryBusiness = useCallback((
    query: string,
    type: 'inventory' | 'sales' | 'analytics' | 'customer' | 'orders',
    language: 'english' | 'kannada' | 'hindi' = 'english'
  ) => {
    businessQueryMutation.mutate({
      query,
      type,
      language
    });
  }, [businessQueryMutation]);

  const clearQueryHistory = useCallback(() => {
    setQueryHistory([]);
  }, []);

  return {
    queryHistory,
    queryBusiness,
    clearQueryHistory,
    isLoading: businessQueryMutation.isPending,
    error: businessQueryMutation.error
  };
};

// Text-to-speech hook
export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const synthesizeMutation = useMutation({
    mutationFn: ({ text, language }: { text: string; language: 'english' | 'kannada' | 'hindi' }) =>
      aiService.synthesizeSpeech(text, language),
    onSuccess: (audioBlob) => {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create and play new audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        toast.error('Failed to play audio');
      };

      setCurrentAudio(audio);
      audio.play().catch(error => {
        console.error('Failed to play audio:', error);
        toast.error('Failed to play audio');
      });
    },
    onError: (error) => {
      console.error('Failed to synthesize speech:', error);
      toast.error('Failed to synthesize speech. Please try again.');
    }
  });

  const speak = useCallback((text: string, language: 'english' | 'kannada' | 'hindi' = 'english') => {
    synthesizeMutation.mutate({ text, language });
  }, [synthesizeMutation]);

  const stopSpeaking = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  }, [currentAudio]);

  return {
    speak,
    stopSpeaking,
    isPlaying,
    isSynthesizing: synthesizeMutation.isPending
  };
};

// Voice recording hook
export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      setMediaRecorder(recorder);
      setRecordedChunks([]);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  }, [mediaRecorder, isRecording]);

  const getRecordedAudio = useCallback(() => {
    if (recordedChunks.length > 0) {
      return new Blob(recordedChunks, { type: 'audio/webm' });
    }
    return null;
  }, [recordedChunks]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    getRecordedAudio
  };
};