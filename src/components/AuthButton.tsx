'use client';

import React from 'react';
import { LogIn, LogOut, User, Sparkles } from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';

interface AuthButtonProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export default function AuthButton({ user }: AuthButtonProps) {
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user.name?.[0] || 'U'}
            </div>
          )}
          <span className="text-xs text-slate-200 font-medium max-w-[120px] truncate hidden sm:inline">
            {user.name || user.email}
          </span>
        </div>

        <button
          onClick={() => signOut()}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/15 transition"
      title="Sign in with Google to get 5 active projects and up to 30-day link duration"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Sign in</span>
    </button>
  );
}
