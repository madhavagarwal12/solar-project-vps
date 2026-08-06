import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoUsers = [
  { email: "field@helios.dev", password: "field1234", name: "Alex Miller" },
  { email: "manager@helios.dev", password: "manager1234", name: "Priya Nair" },
  { email: "admin@helios.dev", password: "admin1234", name: "Sam Okafor" },
];

async function main() {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  for (const user of demoUsers) {
    const existingUser = existingUsers.users.find((candidate) => candidate.email === user.email);
    const result = existingUser
      ? await supabase.auth.admin.updateUserById(existingUser.id, {
          password: user.password,
          email_confirm: true,
          user_metadata: { name: user.name },
        })
      : await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { name: user.name },
        });

    if (result.error) throw result.error;
    console.log(`Synced Supabase Auth user: ${user.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
