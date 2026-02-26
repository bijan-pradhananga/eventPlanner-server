import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('rsvps', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('status', ['yes', 'no', 'maybe']).notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Unique constraint: one RSVP per user per event
    table.unique(['event_id', 'user_id']);
    
    // Indexes
    table.index('event_id');
    table.index('user_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('rsvps');
}
