'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'

interface AudioLevelMeterProps {
  level: number // 0-1 range
  className?: string
}

export function AudioLevelMeter({ level, className = '' }: AudioLevelMeterProps) {
  const t = useTranslations('audioLevel')

  const { labelKey, colorClass, glowIntensity } = useMemo(() => {
    if (level < 0.05) {
      return {
        labelKey: 'silent' as const,
        colorClass: 'bg-[var(--color-cloud-lilac)]/30',
        glowIntensity: 0
      }
    } else if (level < 0.3) {
      return {
        labelKey: 'quiet' as const,
        colorClass: 'audio-meter-fill-cyan',
        glowIntensity: 0.3
      }
    } else if (level < 0.7) {
      return {
        labelKey: 'good' as const,
        colorClass: 'audio-meter-fill-cyan',
        glowIntensity: 0.6
      }
    } else {
      return {
        labelKey: 'loud' as const,
        colorClass: 'bg-gradient-to-r from-[var(--color-pulse-cyan)] to-amber-400',
        glowIntensity: 1
      }
    }
  }, [level])

  const label = t(labelKey)

  const percentage = Math.round(level * 100)

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--color-cloud-lilac)]/50 font-medium">{t('label')}</span>
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-cloud-lilac)]/70">{label}</span>
          <span
            className="font-mono text-[var(--color-pulse-cyan)] min-w-[2.5rem] text-right"
            style={{
              textShadow: glowIntensity > 0 ? `0 0 ${8 * glowIntensity}px var(--color-pulse-cyan)` : 'none'
            }}
          >
            {percentage}%
          </span>
        </div>
      </div>
      <div className="audio-meter relative overflow-hidden">
        <div
          className={`audio-meter-fill ${colorClass} transition-all duration-75`}
          style={{
            width: `${percentage}%`,
            boxShadow: glowIntensity > 0
              ? `0 0 ${12 * glowIntensity}px var(--color-pulse-cyan-glow)`
              : 'none'
          }}
        />
        {/* Animated pulse overlay when recording */}
        {level > 0.05 && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pulse-ring"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  )
}
