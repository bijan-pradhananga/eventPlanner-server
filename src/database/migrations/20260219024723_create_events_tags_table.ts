import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('event_tags', (table) => {
    table.increments('id').primary();
    table.integer('event_id').unsigned().notNullable();
    table.integer('tag_id').unsigned().notNullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('event_id').references('id').inTable('events').onDelete('CASCADE');
    table.foreign('tag_id').references('id').inTable('tags').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate event-tag associations
    table.unique(['event_id', 'tag_id']);
    
    // Indexes
    table.index('event_id');
    table.index('tag_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('event_tags');
}