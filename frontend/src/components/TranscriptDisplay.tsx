'use client'

import { useTranslations } from 'next-intl'

interface TranscriptDisplayProps {
  transcript: string
  interimText: string
  isRecording: boolean
}

export function TranscriptDisplay({
  transcript,
  interimText,
  isRecording,
}: TranscriptDisplayProps) {
  const t = useTranslations('transcript')
  const hasContent = transcript || interimText

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="section-header">{t('title')}</h2>
          {isRecording && (
            <span className="status-badge status-badge-live">
              <span className="live-dot" />
              {t('recording')}
            </span>
          )}
        </div>
        {hasContent && (
          <span className="text-xs text-[var(--color-cloud-lilac)]/40 font-mono">
            {transcript.length.toLocaleString()} {t('chars')}
            {interimText && (
              <span className="text-[var(--color-pulse-cyan)]/60">
                {' '}+{interimText.length}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="transcript-container flex-1 inner-panel rounded-xl p-4 overflow-y-auto">
        {hasContent ? (
          <div className="space-y-3">
            {transcript && (
              <p className="text-[var(--color-cloud-lilac)]/90 leading-relaxed whitespace-pre-wrap text-[0.9375rem]">
                {transcript}
              </p>
            )}
            {interimText && (
              <p className="text-[var(--color-pulse-cyan)]/70 leading-relaxed border-l-2 border-[var(--color-pulse-cyan)]/30 pl-3">
                {interimText}
                <span className="typing-cursor ml-0.5">|</span>
              </p>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              {isRecording ? (
                <>
                  <div className="relative mx-auto w-20 h-20 mb-5">
                    {/* Outer glow */}
                    <div className="absolute inset-0 rounded-full bg-[var(--color-pulse-cyan)]/5 blur-xl" />
                    {/* Animated rings */}
                    <div className="absolute inset-0 rounded-full border border-[var(--color-pulse-cyan)]/20 pulse-ring" />
                    <div className="absolute inset-2 rounded-full border border-[var(--color-pulse-cyan)]/30 pulse-ring animation-delay-200" />
                    <div className="absolute inset-4 rounded-full border border-[var(--color-pulse-cyan)]/40 pulse-ring animation-delay-400" />
                    {/* Center gradient circle */}
                    <div className="absolute inset-5 rounded-full bg-gradient-to-br from-[var(--color-pulse-cyan)]/20 to-transparent" />
                    {/* Center mic icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-7 h-7 text-[var(--color-pulse-cyan)] recording-pulse drop-shadow-[0_0_8px_var(--color-pulse-cyan)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[var(--color-cloud-lilac)]/70 text-sm font-medium">
                    {t('listening')}
                  </p>
                  <p className="text-[var(--color-cloud-lilac)]/40 text-xs mt-1.5">
                    {t('startSpeaking')}
                  </p>
                </>
              ) : (
                <>
                  <div className="relative mx-auto w-16 h-16 mb-5 float-animation">
                    {/* Background glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-pulse-cyan)]/10 to-transparent blur-lg breathe-animation" />
                    {/* Icon container */}
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[var(--color-pulse-cyan)]/15 to-[var(--color-pulse-cyan)]/5 flex items-center justify-center border border-[var(--color-pulse-cyan)]/10">
                      <svg className="w-7 h-7 text-[var(--color-pulse-cyan)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[var(--color-cloud-lilac)]/60 text-sm font-medium">
                    {t('ready')}
                  </p>
                  <p className="text-[var(--color-cloud-lilac)]/35 text-xs mt-1.5 leading-relaxed">
                    {t('clickStart')}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
