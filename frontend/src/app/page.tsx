'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useTranscription } from '@/hooks/useTranscription'
import { AIAnswerDisplay } from '@/components/AIAnswerDisplay'
import { RecordingControls } from '@/components/RecordingControls'
import { TranscriptDisplay } from '@/components/TranscriptDisplay'
import { MicTest } from '@/components/MicTest'

export default function Home() {
  const [showInstructions, setShowInstructions] = useState(false)

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
    <main className="min-h-screen bg-[var(--color-night-navy)] text-[var(--color-cloud-lilac)]">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-3">
            <img
              src="/lmh-logo.webp"
              alt="Live Meeting Helper logo"
              className="h-8 w-auto"
            />
            <span>
              <span className="text-[var(--color-cloud-lilac)]">Live </span>
              <span className="text-[var(--color-pulse-cyan)]">Meeting </span>
              <span className="text-[var(--color-cloud-lilac)]">Helper</span>
            </span>
          </h1>
          <span className="text-sm text-[var(--color-cloud-lilac)]/60">
            Real-time Transcription
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-6 text-gray-200">
                Recording Controls
              </h2>

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
                  className="w-full mt-4 py-2 px-4 rounded-lg bg-green-700 hover:bg-green-600 text-white transition-colors"
                >
                  📥 Download Transcript
                </button>
              )}
            </div>

            {/* Mic Test Section */}
            <MicTest />

            {/* Instructions */}
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <span className="font-medium text-gray-300">📋 Instructions</span>
                <span className="text-gray-500">
                  {showInstructions ? '▲' : '▼'}
                </span>
              </button>

              {showInstructions && (
                <div className="px-4 pb-4 text-sm text-gray-400 space-y-2">
                  <p><strong>1.</strong> Click &ldquo;Start Recording&rdquo; to begin</p>
                  <p><strong>2.</strong> Allow microphone access when prompted</p>
                  <p><strong>3.</strong> Speak clearly into your microphone</p>
                  <p><strong>4.</strong> Watch real-time transcription appear</p>
                  <p><strong>5.</strong> Click &ldquo;Stop Recording&rdquo; when finished</p>
                  <p><strong>6.</strong> Download or copy your transcript</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Transcript + AI */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Top: Transcript */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex-1 min-h-[300px]">
              <TranscriptDisplay
                transcript={transcript}
                interimText={interimText}
                isRecording={isRecording}
              />
            </div>

            {/* Bottom: AI Answer */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 flex-1 min-h-[300px]">
              <AIAnswerDisplay
                answer={aiAnswer}
                isLoading={isAILoading}
                isStreaming={isAIStreaming}
                error={aiError}
                onAskAI={() => requestAIAnswer()}
                onClear={clearAIAnswer}
                hasTranscript={!!transcript}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-[var(--color-cloud-lilac)]/50">
          Created by Peter W. Szabo, in 2026.
        </div>
      </footer>
    </main>
  )
}
