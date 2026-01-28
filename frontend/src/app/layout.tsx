// This is a minimal root layout that delegates to the [locale] layout
// The actual layout with i18n support is in app/[locale]/layout.tsx

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
