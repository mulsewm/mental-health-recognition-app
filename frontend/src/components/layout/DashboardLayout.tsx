import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiHome, FiActivity, FiVideo, FiUsers, FiBarChart2, FiSettings, FiLogOut } from 'react-icons/fi';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title = 'Dashboard' }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Head>
        <title>{title} | Mental Health Risk Assessment</title>
        <meta name="description" content="Interactive dashboard for mental health risk assessment in remote workers" />
      </Head>
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600">MentAI</h1>
          <p className="text-sm text-gray-500">Mental Health Risk Assessment</p>
        </div>
        
        <nav className="mt-6">
          <NavItem href="/dashboard" icon={<FiHome />}>
            Dashboard
          </NavItem>
          <NavItem href="/live-session" icon={<FiActivity />}>
            Live Session
          </NavItem>
          <NavItem href="/analyze" icon={<FiVideo />}>
            Session analyze
          </NavItem>
          <NavItem href="/participants" icon={<FiUsers />}>
            Participants
          </NavItem>
          <NavItem href="/analytics" icon={<FiBarChart2 />}>
            Analytics
          </NavItem>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <NavItem href="/settings" icon={<FiSettings />}>
              Settings
            </NavItem>
            <button className="flex items-center w-full px-6 py-3 text-gray-600 hover:bg-gray-100 transition-colors">
              <FiLogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none">
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  U
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Researcher</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Mental Health Risk Assessment Tool. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

function NavItem({ href, icon, children }: NavItemProps) {
  return (
    <Link href={href}>
      <a className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-100 transition-colors">
        <span className="w-5 h-5 mr-3">{icon}</span>
        <span>{children}</span>
      </a>
    </Link>
  );
}
