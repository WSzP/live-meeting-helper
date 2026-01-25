'use client'

interface AIAnswerDisplayProps {
  answer: string
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  onAskAI: () => void
  onClear: () => void
  hasTranscript: boolean
  isConnected: boolean
}

export function AIAnswerDisplay({
  answer,
  isLoading,
  isStreaming,
  error,
  onAskAI,
  onClear,
  hasTranscript,
  isConnected,
}: AIAnswerDisplayProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-200">
          AI Assistant
          {isStreaming && (
            <span className="ml-2 text-sm text-blue-400 animate-pulse">
              typing...
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {answer && (
            <button
              onClick={onClear}
              className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onAskAI}
            disabled={!hasTranscript || !isConnected || isLoading}
            className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white transition-colors"
          >
            {isLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
      </div>

      <div className="ai-answer-container flex-1 bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-y-auto">
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm mb-3">
            {error}
          </div>
        )}

        {answer ? (
          <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
            {answer}
            {isStreaming && <span className="animate-pulse">|</span>}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 text-center">
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-2">&#9881;</span>
                  Analyzing transcript...
                </>
              ) : (
                <>
                  Click &ldquo;Ask AI&rdquo; to get insights from the transcript.
                  <br />
                  <span className="text-sm">
                    The AI will analyze questions, suggest action items, and provide summaries.
                  </span>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
