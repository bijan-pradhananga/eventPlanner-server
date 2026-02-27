import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const saltRounds = 10;
  const password = await bcrypt.hash('password123', saltRounds);

  const firstNames = [
    'Alice', 'Bob', 'Carol', 'David', 'Eva',
    'Frank', 'Grace', 'Henry', 'Ivy', 'Jack',
    'Karen', 'Leo', 'Mia', 'Noah', 'Olivia',
    'Paul', 'Quinn', 'Ryan', 'Sophia', 'Tom',
    'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zane'
  ];

  const lastNames = [
    'Johnson', 'Smith', 'White', 'Brown', 'Martinez',
    'Taylor', 'Anderson', 'Thomas', 'Jackson', 'Harris'
  ];

  const users = [];

  // ✅ Fixed Test User
  users.push({
    email: 'test@gmail.com',
    password_hash: password,
    first_name: 'Test',
    last_name: 'User',
    email_verified_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  });

  // ✅ Generate 50 Random Users
  for (let i = 1; i <= 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    users.push({
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      password_hash: password,
      first_name: firstName,
      last_name: lastName,
      email_verified_at:
        Math.random() > 0.3
          ? new Date(2026, 0, Math.floor(Math.random() * 28) + 1)
          : null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  await knex('users').insert(users);
}