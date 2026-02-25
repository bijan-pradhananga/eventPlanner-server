import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const saltRounds = 10;
  const password = await bcrypt.hash('password123', saltRounds);

  await knex('users').insert([
    {
      email: 'alice.johnson@example.com',
      password_hash: password,
      first_name: 'Alice',
      last_name: 'Johnson',
      email_verified_at: new Date('2026-01-05 10:00:00')
    },
    {
      email: 'bob.smith@example.com',
      password_hash: password,
      first_name: 'Bob',
      last_name: 'Smith',
      email_verified_at: new Date('2026-01-10 09:30:00')
    },
    {
      email: 'carol.white@example.com',
      password_hash: password,
      first_name: 'Carol',
      last_name: 'White',
      email_verified_at: new Date('2026-01-15 14:00:00')
    },
    {
      email: 'david.brown@example.com',
      password_hash: password,
      first_name: 'David',
      last_name: 'Brown',
      email_verified_at: null
    },
    {
      email: 'eva.martinez@example.com',
      password_hash: password,
      first_name: 'Eva',
      last_name: 'Martinez',
      email_verified_at: new Date('2026-02-01 11:00:00')
    }
  ]);
}
