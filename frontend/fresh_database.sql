-- 1. CREATE PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CREATE SESSIONS TABLE
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  cases JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. SECURITY POLICIES FOR PROFILES
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. SECURITY POLICIES FOR SESSIONS
CREATE POLICY "Users can view their own sessions" 
  ON public.sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
  ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
  ON public.sessions FOR DELETE USING (auth.uid() = user_id);

-- 7. SECURITY POLICIES FOR MESSAGES
CREATE POLICY "Users can view messages for their sessions" 
  ON public.messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "Users can insert messages to their sessions" 
  ON public.messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));

CREATE POLICY "Users can delete messages from their sessions"
  ON public.messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.sessions WHERE sessions.id = messages.session_id AND sessions.user_id = auth.uid()));

-- 8. AUTH TRIGGER FOR NEW SIGNUPS
-- This automatically creates a profile row whenever a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'User'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
