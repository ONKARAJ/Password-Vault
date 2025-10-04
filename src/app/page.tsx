'use client';

import { useApp } from '@/contexts/AppContext';
import AuthForm from '@/components/AuthForm';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { isAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <div className="flex items-center justify-center min-h-screen p-4">
          <AuthForm />
        </div>
      )}
    </div>
  );
}
