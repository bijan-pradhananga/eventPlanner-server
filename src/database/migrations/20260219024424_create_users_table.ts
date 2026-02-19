import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.timestamp('email_verified_at').nullable();
    table.timestamps(true, true);
    
    // Indexes
    table.index('email');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}