import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Love Q - AI 연애 답변 도우미',
  description: '카톡 대화를 분석하여 자연스러운 연애 답변을 제안하는 AI 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
