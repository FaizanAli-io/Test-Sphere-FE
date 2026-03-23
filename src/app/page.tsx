'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/hooks/useApi';

const Auth = dynamic(() => import('@/components/Auth'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
    </div>
  ),
  ssr: false,
});

export default function AuthPage() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const validateAndRedirect = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (!token || !role) {
          // No credentials, show auth
          setShowAuth(true);
          setChecking(false);
          return;
        }

        // Validate token by making an authenticated API call
        const res = await api('/auth/me', { auth: true, method: 'GET' });

        if (res.ok) {
          // Token is valid, redirect to appropriate portal
          const userRole = role.toLowerCase();
          if (userRole === 'teacher') {
            router.replace('/teacher');
          } else if (userRole === 'student') {
            router.replace('/student');
          } else {
            // Invalid role, show auth
            setShowAuth(true);
          }
        } else {
          // Token is expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          setShowAuth(true);
        }
      } catch (error) {
        // Error during validation, clear auth and show login
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setShowAuth(true);
      } finally {
        setChecking(false);
      }
    };

    validateAndRedirect();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  return showAuth ? <Auth /> : null;
}
