import React, { useState, useEffect } from 'react';
import ChatPage from './ChatPage';
import { supabase } from './supabaseClient';

export interface UserSession {
  userId: string;
  isGuest: boolean;
  displayName: string;
  dbSessionId?: string;
}

export default function App() {
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // ── On mount: check for existing Supabase session, else default to Guest ──
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Authenticated user found — restore their session
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUserSession({
          userId: session.user.id,
          isGuest: false,
          displayName: profile?.display_name || session.user.email?.split('@')[0] || 'Counselor',
        });
      } else {
        // No auth session — drop straight into guest mode
        setUserSession({
          userId: `guest_${Date.now()}`,
          isGuest: true,
          displayName: 'Counselor',
        });
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // User signed out — revert to guest
        setUserSession({
          userId: `guest_${Date.now()}`,
          isGuest: true,
          displayName: 'Counselor',
        });
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Sign-in handler (called from sidebar) ────────────────────────────────
  const handleSignIn = async (userId: string, displayName: string) => {
    let dbSessionId: string | undefined;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: userId, title: 'New Consultation' })
        .select('id')
        .single();
      if (error) console.error('Create session error:', error.message);
      if (data) dbSessionId = data.id;
    } catch (err) {
      console.error('Failed to create session:', err);
    }

    setUserSession({ userId, isGuest: false, displayName, dbSessionId });
  };

  if (!userSession) {
    // Brief loading state — will resolve almost instantly
    return null;
  }

  return (
    <ChatPage
      userSession={userSession}
      setUserSession={setUserSession}
      onSignIn={handleSignIn}
    />
  );
}
