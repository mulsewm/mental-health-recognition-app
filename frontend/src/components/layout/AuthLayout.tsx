import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackLink?: boolean;
}

export default function AuthLayout({
  children,
  title = 'Welcome Back',
  subtitle = 'Sign in to your account',
  showBackLink = false,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Head>
        <title>{title} | Mental Health Risk Assessment</title>
        <meta name="description" content="Mental health risk assessment for remote workers" />
      </Head>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      {showBackLink && (
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center">
            <FiArrowLeft className="mr-1" /> Back to home
          </Link>
        </div>
      )}

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Mental Health Risk Assessment Tool. All rights reserved.
      </div>
    </div>
  );
}
