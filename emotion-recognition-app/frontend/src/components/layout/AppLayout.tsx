import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiHome, FiCamera, FiVideo, FiSettings, FiBarChart2 } from 'react-icons/fi';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = 'Emotion Recognition' }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title} | Emotion Recognition</title>
        <meta name="description" content="Real-time facial emotion recognition" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">MentAI</h1>
            </div>
            <nav className="hidden md:ml-6 md:flex space-x-8">
              <NavLink href="/" icon={<FiHome className="h-5 w-5" />}>
                Home
              </NavLink>
              <NavLink href="/live" icon={<FiCamera className="h-5 w-5" />}>
                Live Analysis
              </NavLink>
              <NavLink href="/recordings" icon={<FiVideo className="h-5 w-5" />}>
                Recordings
              </NavLink>
              <NavLink href="/analytics" icon={<FiBarChart2 className="h-5 w-5" />}>
                Analytics
              </NavLink>
            </nav>
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none">
                <FiSettings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around items-center h-16">
          <MobileNavLink href="/" icon={<FiHome className="h-6 w-6" />}>
            Home
          </MobileNavLink>
          <MobileNavLink href="/live" icon={<FiCamera className="h-6 w-6" />}>
            Live
          </MobileNavLink>
          <MobileNavLink href="/recordings" icon={<FiVideo className="h-6 w-6" />}>
            Recordings
          </MobileNavLink>
          <MobileNavLink href="/analytics" icon={<FiBarChart2 className="h-6 w-6" />}>
            Analytics
          </MobileNavLink>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-grow pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

function NavLink({ href, icon, children }: NavLinkProps) {
  return (
    <Link href={href} className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );
}

function MobileNavLink({ href, icon, children }: NavLinkProps) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center px-2 py-2 text-xs text-gray-600 hover:text-indigo-600">
      {icon}
      <span className="mt-1">{children}</span>
    </Link>
  );
}
