# Database Migration Guide

## Option 1: Using Supabase Studio (SQL Editor) - RECOMMENDED

### Steps:
1. Access your Supabase Studio/Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy and paste the migration SQL from `supabase/migrations/20251220000000_auto_confirm_users.sql`
5. Click "Run" (or press Ctrl+Enter)
6. Verify success message

### SQL to Run:
See the migration file content above.

---

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Or run specific migration
supabase migration up
```

---

## Option 3: Using psql (Direct Database Connection)

If you have direct database access:

```bash
# Connect to your database
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# Then run the migration
\i supabase/migrations/20251220000000_auto_confirm_users.sql
```

---

## Option 4: Using Coolify Database Terminal

1. In Coolify, go to your Supabase resource
2. Open the "Terminal" tab
3. Connect to PostgreSQL:
   ```bash
   psql -U postgres -d postgres
   ```
4. Paste and run the migration SQL

---

## Verification

After running the migration, verify it worked:

```sql
-- Check if the function exists
SELECT proname FROM pg_proc WHERE proname = 'auto_confirm_user';

-- Check if the trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created_auto_confirm';
```

Both should return results if the migration was successful.

---

## Troubleshooting

If you get permission errors:
- Make sure you're using a user with SUPERUSER or appropriate privileges
- The function uses SECURITY DEFINER, so it should work even without direct auth schema access

If the trigger doesn't work:
- Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'auto_confirm_user';`
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_auto_confirm';`

