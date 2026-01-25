'use client'

import Image from 'next/image'
import { useCallback, useState, useEffect, useRef } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useTranscription } from '@/hooks/useTranscription'
import { AIAnswerDisplay } from '@/components/AIAnswerDisplay'
import { RecordingControls } from '@/components/RecordingControls'
import { TranscriptDisplay } from '@/components/TranscriptDisplay'
import { MicTest } from '@/components/MicTest'

export default function Home() {
  // Transcribe-only mode: when false (default), AI analyzes automatically
  const [transcribeOnly, setTranscribeOnly] = useState(false)

  const {
    transcript,
    interimText,
    isConnected,
    error: transcriptionError,
    aiAnswer,
    isAILoading,
    isAIStreaming,
    aiError,
    connect,
    disconnect,
    sendAudio,
    clearTranscript,
    requestAIAnswer,
    clearAIAnswer,
  } = useTranscription()

  // Track last analyzed transcript length to avoid redundant requests
  const lastAnalyzedLengthRef = useRef(0)
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnalysisTimeRef = useRef(0) // Cooldown tracking

  const handleAudioData = useCallback((data: Blob) => {
    sendAudio(data)
  }, [sendAudio])

  const {
    isRecording,
    audioLevel,
    sampleRate,
    error: recorderError,
    startRecording,
    stopRecording,
  } = useAudioRecorder(handleAudioData, 250)

  // Auto-analyze transcript with AI when not in transcribe-only mode
  useEffect(() => {
    // Skip if in transcribe-only mode, not recording, no connection, or already analyzing
    if (transcribeOnly || !isRecording || !isConnected || isAILoading || isAIStreaming) {
      return
    }

    // Need at least some content
    if (transcript.length < 20) {
      return
    }

    // Cooldown: don't trigger within 10 seconds of last analysis
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current
    if (timeSinceLastAnalysis < 10000) {
      return
    }

    const newContentLength = transcript.length - lastAnalyzedLengthRef.current

    // Detect if transcript contains a question (ends with ? or has question words)
    const hasQuestion = /\?/.test(transcript) ||
      /\b(what|why|how|when|where|who|which|can you|could you|would you|is it|are there)\b/i.test(transcript)

    // For questions: trigger faster with less content
    // For general content: wait for more substantial updates
    const shouldTrigger = hasQuestion
      ? newContentLength >= 20  // Questions: just need 20 new chars
      : newContentLength >= 80  // General: need 80 new chars

    const debounceTime = hasQuestion ? 1500 : 3000  // Questions: 1.5s, General: 3s

    if (shouldTrigger) {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }

      analysisTimeoutRef.current = setTimeout(() => {
        if (isConnected && !isAILoading && !isAIStreaming && !transcribeOnly) {
          lastAnalyzedLengthRef.current = transcript.length
          lastAnalysisTimeRef.current = Date.now()
          requestAIAnswer()
        }
      }, debounceTime)
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
    }
  }, [transcript, isRecording, isConnected, isAILoading, isAIStreaming, transcribeOnly, requestAIAnswer])

  // Reset analysis tracking when recording starts
  useEffect(() => {
    if (isRecording) {
      lastAnalyzedLengthRef.current = 0
    }
  }, [isRecording])

  const handleStartRecording = useCallback(async () => {
    connect()
    await startRecording()
  }, [connect, startRecording])

  const handleStopRecording = useCallback(() => {
    stopRecording()
    // Small delay before disconnecting to ensure last audio is processed
    setTimeout(() => {
      disconnect()
    }, 500)
  }, [stopRecording, disconnect])

  const handleDownloadTranscript = useCallback(() => {
    if (!transcript) return

    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [transcript])

  const error = recorderError || transcriptionError

  return (
    <main className="min-h-screen bg-[var(--color-night-navy)] text-[var(--color-cloud-lilac)] flex flex-col relative">
      {/* Ambient Background */}
      <div className="ambient-background" aria-hidden="true" />
      <div className="noise-overlay" aria-hidden="true" />

      {/* Header */}
      <header className="premium-header relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="logo-glow relative">
              <Image
                src="/lmh-logo.webp"
                alt="Live Meeting Helper logo"
                width={120}
                height={36}
                className="h-9 w-auto relative z-10"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight leading-none">
                <span className="text-[var(--color-cloud-lilac)]">Live </span>
                <span className="gradient-text">Meeting</span>
                <span className="text-[var(--color-cloud-lilac)]"> Helper</span>
              </h1>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-cloud-lilac)]/40 mt-0.5">
                AI-Powered Transcription
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Badge */}
            {isRecording && (
              <div className="status-badge status-badge-live transition-all duration-300">
                <span className="live-dot" />
                <span className="font-medium">Live</span>
              </div>
            )}

            {/* GitHub Link */}
            <a
              href="https://github.com/WSzP/live-meeting-helper"
              target="_blank"
              rel="noopener noreferrer"
              className="status-badge status-badge-idle hover:border-white/20 hover:bg-white/8 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span className="font-medium">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-5">
            {/* Recording Controls Card */}
            <div className={`glass-card rounded-2xl p-6 ${isRecording ? 'glass-card-highlight gradient-border-animated' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="section-header">Recording Controls</h2>
                {isConnected && (
                  <span className="status-badge status-badge-connected">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Connected
                  </span>
                )}
              </div>

              <RecordingControls
                isRecording={isRecording}
                isConnected={isConnected}
                audioLevel={audioLevel}
                sampleRate={sampleRate}
                error={error}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onClearTranscript={clearTranscript}
                hasTranscript={!!transcript}
              />

              {/* Download Button */}
              {transcript && (
                <button
                  onClick={handleDownloadTranscript}
                  className="btn-success w-full mt-4 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Transcript
                </button>
              )}

              {/* AI Mode Toggle */}
              <div className="mt-3">
                <div
                  role="switch"
                  aria-checked={!transcribeOnly ? "true" : "false"}
                  aria-label="AI Assistant toggle"
                  tabIndex={0}
                  onClick={() => setTranscribeOnly(!transcribeOnly)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setTranscribeOnly(!transcribeOnly) } }}
                  className="relative w-full h-10 rounded-xl bg-white/5 border border-white/10 cursor-pointer overflow-hidden"
                >
                  {/* Sliding background */}
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-300 ease-out ${
                      transcribeOnly
                        ? 'left-[calc(50%+2px)] bg-white/10'
                        : 'left-1 bg-emerald-500/25 shadow-[0_0_12px_-2px_rgba(34,197,94,0.4)]'
                    }`}
                  />

                  {/* Labels */}
                  <div className="relative flex h-full pointer-events-none">
                    {/* AI Active side */}
                    <span
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-300 ${
                        !transcribeOnly
                          ? 'text-emerald-400'
                          : 'text-[var(--color-cloud-lilac)]/40'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Active AI Assistance</span>
                    </span>

                    {/* Transcribe Only side */}
                    <span
                      className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium transition-all duration-300 ${
                        transcribeOnly
                          ? 'text-[var(--color-cloud-lilac)]/70'
                          : 'text-[var(--color-cloud-lilac)]/40'
                      }`}
                    >
                      <svg className={`w-3.5 h-3.5 ${transcribeOnly ? 'text-red-400/70' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span>Only Transcribe</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mic Test Section */}
            <MicTest />
          </div>

          {/* Right Panel - Transcript + AI */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Transcript Panel */}
            <div className={`glass-card rounded-2xl p-6 flex-1 min-h-[300px] transition-all duration-500 ${isRecording ? 'glow-cyan' : ''}`}>
              <TranscriptDisplay
                transcript={transcript}
                interimText={interimText}
                isRecording={isRecording}
              />
            </div>

            {/* AI Answer Panel */}
            <div className={`glass-card rounded-2xl p-6 flex-1 min-h-[300px] transition-all duration-500 relative ${transcribeOnly ? 'opacity-40 hover:opacity-60' : ''}`}>
              {transcribeOnly && (
                <div
                  className="absolute inset-0 z-10 cursor-pointer rounded-2xl"
                  onClick={() => setTranscribeOnly(false)}
                  title="Click to enable AI Assistant"
                  aria-label="Enable AI Assistant"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setTranscribeOnly(false) }}
                />
              )}
              <AIAnswerDisplay
                answer={aiAnswer}
                isLoading={isAILoading}
                isStreaming={isAIStreaming}
                error={aiError}
                onClear={clearAIAnswer}
                hasTranscript={!!transcript}
                isConnected={isConnected}
                transcribeOnly={transcribeOnly}
              />
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}
