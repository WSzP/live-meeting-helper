'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AudioLevelMeter } from './AudioLevelMeter'

interface MicTestProps {
  className?: string
}

export function MicTest({ className = '' }: MicTestProps) {
  const t = useTranslations('micTest')
  const tErrors = useTranslations('errors')
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }

    streamRef.current?.getTracks().forEach(track => track.stop())

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setIsRecording(false)
    setAudioLevel(0)
  }, [])

  // Audio level monitoring effect
  useEffect(() => {
    if (!isRecording || !analyserRef.current) return

    const updateLevel = () => {
      if (!analyserRef.current) return

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)

      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i]
      }
      const rms = Math.sqrt(sum / dataArray.length)
      setAudioLevel(Math.min(1, rms / 128))

      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    animationFrameRef.current = requestAnimationFrame(updateLevel)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRecording])

  const startTest = useCallback(async () => {
    try {
      setError(null)
      setAudioUrl(null)
      setFrameCount(0)
      chunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          setFrameCount(prev => prev + 1)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      mediaRecorder.start(100) // 100ms chunks
      setIsRecording(true)

      // Auto-stop after 3 seconds
      timeoutRef.current = setTimeout(() => {
        cleanup()
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : tErrors('microphoneAccess'))
    }
  }, [cleanup, tErrors])

  const clearTest = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setFrameCount(0)
    setError(null)
  }, [audioUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  const remainingSeconds = Math.max(0, 3 - Math.floor(frameCount / 10))

  return (
    <div className={`glass-card rounded-2xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-header flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-pulse-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          {t('title')}
        </h3>
        {isRecording && (
          <span className="status-badge status-badge-live">
            <span className="live-dot" />
            {remainingSeconds}s
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--color-cloud-lilac)]/40 mb-4">
        {t('description')}
      </p>

      <button
        type="button"
        onClick={isRecording ? cleanup : startTest}
        disabled={isRecording}
        className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
          isRecording
            ? 'bg-[var(--color-pulse-cyan)]/10 text-[var(--color-pulse-cyan)]/60 cursor-not-allowed border border-[var(--color-pulse-cyan)]/20'
            : 'btn-secondary hover:border-[var(--color-pulse-cyan)]/30'
        }`}
      >
        {isRecording ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-pulse-cyan)] recording-indicator" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-pulse-cyan)]" />
            </span>
            {t('recording')}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            {t('testButton')}
          </>
        )}
      </button>

      {isRecording && (
        <div className="mt-4">
          <AudioLevelMeter level={audioLevel} />
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {audioUrl && (
        <div className="mt-4 space-y-3">
          <div className="inner-panel rounded-lg p-3">
            <audio controls src={audioUrl} className="w-full h-8" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[var(--color-cloud-lilac)]/40">
              {t('recorded', { count: frameCount })}
            </span>
            <button
              type="button"
              onClick={clearTest}
              className="btn-pill text-xs"
            >
              {t('clear')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
