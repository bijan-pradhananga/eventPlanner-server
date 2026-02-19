import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.datetime('event_date').notNullable();
    table.datetime('event_end_date').nullable();
    table.string('location', 500).nullable();
    table.enum('event_type', ['public', 'private']).defaultTo('public');
    table.integer('user_id').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign key
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index('user_id');
    table.index('event_date');
    table.index('event_type');
    table.index(['event_date', 'event_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('events');
}