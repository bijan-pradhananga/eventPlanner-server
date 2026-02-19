import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tags', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('color', 7).defaultTo('#3B82F6'); // Default blue color
    table.timestamps(true, true);
    
    // Indexes
    table.index('name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tags');
}