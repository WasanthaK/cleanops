/**
 * Voice recording service using Web Audio API and Speech Recognition
 */

export interface RecordingOptions {
  language?: string;
  maxDuration?: number; // in seconds
}

export interface VoiceRecordingResult {
  audioBlob: Blob;
  duration: number;
  transcript?: string;
}

export class VoiceRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private recognition: any = null;

  /**
   * Check if voice recording is supported
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Start recording audio
   */
  async startRecording(options: RecordingOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Voice recording is not supported in this browser');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.mediaRecorder.start();

      // Auto-stop if maxDuration is set
      if (options.maxDuration) {
        setTimeout(() => {
          if (this.mediaRecorder?.state === 'recording') {
            this.stopRecording();
          }
        }, options.maxDuration * 1000);
      }

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone. Please grant permission.');
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<VoiceRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = Math.floor((Date.now() - this.startTime) / 1000);

        // Stop all tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());

        console.log(`Recording stopped. Duration: ${duration}s, Size: ${audioBlob.size} bytes`);
        
        resolve({
          audioBlob,
          duration
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.audioChunks = [];
      console.log('Recording cancelled');
    }
  }

  /**
   * Start speech recognition for live transcription
   */
  startSpeechRecognition(
    onResult: (transcript: string) => void,
    onError?: (error: any) => void,
    language: string = 'en-US'
  ): void {
    if (!this.isSpeechRecognitionSupported()) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = language;

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.start();
    console.log('Speech recognition started');
  }

  /**
   * Stop speech recognition
   */
  stopSpeechRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
      console.log('Speech recognition stopped');
    }
  }

  /**
   * Transcribe audio blob (simplified - uses Web Speech API)
   * For production, send to backend for Google Cloud Speech / AWS Transcribe
   */
  async transcribeAudio(audioBlob: Blob, language: string = 'en-US'): Promise<string> {
    // This is a simplified approach
    // In production, you would:
    // 1. Upload audioBlob to backend
    // 2. Backend processes with Google Cloud Speech / AWS Transcribe
    // 3. Return transcribed text
    
    console.warn('Client-side transcription is limited. Use backend service for production.');
    return 'Transcription requires backend service (Google Cloud Speech or AWS Transcribe)';
  }

  /**
   * Parse voice command
   */
  parseCommand(transcript: string): { action: string; params?: any } {
    const text = transcript.toLowerCase().trim();

    if (text.includes('clock in') || text.includes('start job')) {
      return { action: 'CLOCK_IN' };
    }

    if (text.includes('clock out') || text.includes('end shift')) {
      return { action: 'CLOCK_OUT' };
    }

    if (text.includes('complete task')) {
      const taskMatch = text.match(/complete task (.+)/);
      return {
        action: 'COMPLETE_TASK',
        params: { taskName: taskMatch?.[1] }
      };
    }

    if (text.includes('report incident') || text.includes('incident')) {
      return { action: 'REPORT_INCIDENT' };
    }

    if (text.includes('take photo') || text.includes('photo')) {
      return { action: 'TAKE_PHOTO' };
    }

    return { action: 'UNKNOWN' };
  }
}

export const voiceRecordingService = new VoiceRecordingService();
