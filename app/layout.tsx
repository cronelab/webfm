import '../styles/index.scss'
import Header from '../components/Shared/Header'
import Footer from '../components/Shared/Footer'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
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
