'use client'

import { AudioLevelMeter } from './AudioLevelMeter'

interface RecordingControlsProps {
  isRecording: boolean
  isConnected: boolean
  audioLevel: number
  sampleRate: number
  error: string | null
  onStartRecording: () => void
  onStopRecording: () => void
  onClearTranscript: () => void
  hasTranscript: boolean
}

export function RecordingControls({
  isRecording,
  isConnected,
  audioLevel,
  sampleRate,
  error,
  onStartRecording,
  onStopRecording,
  onClearTranscript,
  hasTranscript,
}: RecordingControlsProps) {
  return (
    <div className="space-y-5">
      {/* Main Recording Button */}
      <button
        type="button"
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-3 ${
          isRecording
            ? 'btn-danger'
            : 'btn-primary'
        }`}
      >
        {isRecording ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-sm bg-white/30" />
              <span className="relative inline-flex rounded-sm h-3 w-3 bg-white" />
            </span>
            Stop Recording
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            Start Recording
          </>
        )}
      </button>

      {/* Audio Level Meter - only show when recording */}
      {isRecording && (
        <div className="space-y-2">
          <AudioLevelMeter level={audioLevel} />
        </div>
      )}

      {/* Debug Info - only show when recording */}
      {isRecording && sampleRate > 0 && (
        <div className="flex items-center justify-between text-xs text-[var(--color-cloud-lilac)]/40 px-1">
          <span>Sample Rate</span>
          <span className="font-mono">{sampleRate.toLocaleString()} Hz</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Clear Transcript Button */}
      {hasTranscript && !isRecording && (
        <button
          type="button"
          onClick={onClearTranscript}
          className="btn-secondary w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Transcript
        </button>
      )}
    </div>
  )
}
