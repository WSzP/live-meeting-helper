'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { routing, type AppLocale } from '@/i18n/routing'

const localeNames: Record<AppLocale, string> = {
  en: 'English',
  hu: 'Magyar',
  ro: 'Romana'
}

const localeFlags: Record<AppLocale, string> = {
  en: 'EN',
  hu: 'HU',
  ro: 'RO'
}

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: AppLocale) => {
    // Remove current locale prefix and add new one
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <div className="relative group z-50">
      <button
        type="button"
        className="status-badge status-badge-idle hover:border-white/20 hover:bg-white/8 transition-all duration-300 flex items-center gap-2"
        aria-label="Select language"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="font-medium">{localeFlags[locale]}</span>
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 top-full mt-2 py-1 min-w-[140px] bg-[var(--color-night-navy-light)] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => handleLocaleChange(loc)}
            className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 ${
              loc === locale
                ? 'text-[var(--color-pulse-cyan)] bg-[var(--color-pulse-cyan)]/10'
                : 'text-[var(--color-cloud-lilac)]/70 hover:text-[var(--color-cloud-lilac)] hover:bg-white/5'
            }`}
          >
            <span className="font-mono text-xs opacity-60">{localeFlags[loc]}</span>
            <span>{localeNames[loc]}</span>
            {loc === locale && (
              <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
