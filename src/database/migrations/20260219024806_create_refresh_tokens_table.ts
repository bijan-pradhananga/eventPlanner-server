import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.string('token', 500).notNullable().unique();
    table.integer('user_id').unsigned().notNullable();
    table.datetime('expires_at').notNullable();
    table.boolean('is_revoked').defaultTo(false);
    table.timestamps(true, true);
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('user_id');
    table.index('token');
    table.index('expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('refresh_tokens');
}