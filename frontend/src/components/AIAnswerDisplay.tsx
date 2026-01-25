'use client'

import { useEffect, useRef } from 'react'

interface AIAnswerDisplayProps {
  answer: string
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  onClear: () => void
  hasTranscript: boolean
  isConnected: boolean
  transcribeOnly?: boolean
}

// Simple markdown to HTML converter
function renderMarkdown(text: string): string {
  return text
    // Headers (must be at line start)
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1 text-[var(--color-pulse-cyan)]">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-2 text-[var(--color-pulse-cyan)]">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2 text-[var(--color-pulse-cyan)]">$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--color-cloud-lilac)]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet points
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4">$1</li>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // Line breaks
    .replace(/\n/g, '<br />')
}

export function AIAnswerDisplay({
  answer,
  isLoading,
  isStreaming,
  error,
  onClear,
  hasTranscript,
  isConnected,
  transcribeOnly = false,
}: AIAnswerDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (containerRef.current && (answer || isStreaming)) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [answer, isStreaming])
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="section-header flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-pulse-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Assistant
          </h2>
          {isStreaming && (
            <span className="status-badge status-badge-live">
              <span className="live-dot" />
              Streaming
            </span>
          )}
        </div>
        {answer && (
          <button
            type="button"
            onClick={onClear}
            className="btn-pill"
          >
            Clear
          </button>
        )}
      </div>

      <div ref={containerRef} className="ai-answer-container flex-1 inner-panel rounded-xl p-4 overflow-y-auto scroll-smooth">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {answer ? (
          <div className="text-[var(--color-cloud-lilac)]/90 leading-relaxed text-[0.9375rem]">
            <span dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }} />
            {isStreaming && <span className="typing-cursor ml-0.5">|</span>}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              {isLoading ? (
                <>
                  <div className="relative mx-auto w-20 h-20 mb-5">
                    {/* Outer glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-pulse-cyan)]/10 to-[var(--color-accent-purple)]/10 blur-xl animate-pulse" />

                    {/* Spinning outer ring */}
                    <div className="absolute inset-0 rounded-full border border-[var(--color-pulse-cyan)]/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-pulse-cyan)]/80 border-r-[var(--color-pulse-cyan)]/40 spin-slow" />

                    {/* Inner spinning ring (reverse) */}
                    <div className="absolute inset-3 rounded-full border border-[var(--color-accent-purple)]/20" />
                    <div className="absolute inset-3 rounded-full border border-transparent border-b-[var(--color-accent-purple)]/60 spin-reverse" />

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-pulse-cyan)]/20 to-[var(--color-accent-purple)]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--color-pulse-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <p className="text-[var(--color-cloud-lilac)]/70 text-sm font-medium shimmer-text">
                    Analyzing transcript...
                  </p>
                  <p className="text-[var(--color-cloud-lilac)]/40 text-xs mt-1.5">
                    Generating intelligent insights
                  </p>
                </>
              ) : (
                <>
                  <div className="relative mx-auto w-20 h-20 mb-5 float-animation-delayed">
                    {/* Ambient glow */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--color-pulse-cyan)]/8 via-[var(--color-accent-purple)]/5 to-transparent blur-xl breathe-animation" />

                    {/* Orbiting particles */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="orbit-particle">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-pulse-cyan)]/60 shadow-[0_0_6px_var(--color-pulse-cyan)]" />
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="orbit-particle-reverse">
                        <div className="w-1 h-1 rounded-full bg-[var(--color-accent-purple)]/50 shadow-[0_0_4px_var(--color-accent-purple)]" />
                      </div>
                    </div>

                    {/* Center icon container */}
                    <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-[var(--color-pulse-cyan)]/15 via-[var(--color-accent-purple)]/10 to-transparent flex items-center justify-center border border-white/5">
                      <svg className="w-6 h-6 text-[var(--color-pulse-cyan)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[var(--color-cloud-lilac)]/60 text-sm font-medium">
                    {transcribeOnly ? 'AI Assistant Disabled' : 'AI-powered insights'}
                  </p>
                  <p className="text-[var(--color-cloud-lilac)]/35 text-xs mt-1.5 leading-relaxed">
                    {transcribeOnly ? (
                      <>Enable AI Assistant to get<br />automatic analysis</>
                    ) : (
                      <>Start recording and insights will<br />appear automatically</>
                    )}
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
