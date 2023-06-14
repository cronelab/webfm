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
        {/* <Header /> */}
        {children}
        <Footer />
      </body>
    </html>
  )
}

export const metadata = {
  title: 'Home',
  description: 'Welcome to Next.js',
}
