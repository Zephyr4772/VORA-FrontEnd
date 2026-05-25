import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://simcjlavhzawcoeasqub.supabase.co';
const supabaseAnonKey = 'sb_publishable_LWBCPXfj0RMReXGtneDudw_QsRXSmT7';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log("1. Signing IN test user...");
  const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
    email: 'john.doe123@gmail.com',
    password: 'password123'
  });

  if (signError) {
    console.error("Sign In Error:", signError.message);
    process.exit(1);
  }

  const user = signData.user;
  const session = signData.session;
  
  if (!user || !session) {
    console.error("No session returned.");
    process.exit(1);
  }

  supabase.globalHeaders = {
    Authorization: `Bearer ${session.access_token}`
  };
  
  console.log("User created and authenticated. ID:", user?.id || supabase.auth.user()?.id);

  console.log("2. Creating a test session...");
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, title: 'Test Consultation on Rights' })
    .select('id')
    .single();

  if (sessionError) {
    console.error("Session Error (Did you run the SQL script?):", sessionError.message);
    process.exit(1);
  }

  const sessionId = sessionData.id;
  console.log("Session created. ID:", sessionId);

  console.log("3. Inserting messages...");
  const { error: msgError1 } = await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'user',
    content: 'What are my rights?'
  });
  
  const { error: msgError2 } = await supabase.from('messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: 'You have the right to remain silent.'
  });

  if (msgError1 || msgError2) {
    console.error("Message Error:", msgError1?.message || msgError2?.message);
    process.exit(1);
  }

  console.log("Messages inserted successfully.");
  console.log("\n==============================");
  console.log("SUCCESS! Test data is seeded.");
  console.log("You can now log in with:");
  console.log("Email: " + user.email);
  console.log("Password: password123");
  console.log("==============================");
}

seed();
