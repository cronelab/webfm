import './index.scss'
import { Header, Footer } from '../components/Shared/Header'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}

export const metadata = {
  title: 'WebFM',
}
