import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('two_factor_codes', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('code', 6).notNullable();
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');

    // Index for fast lookups during verification
    table.index(['user_id', 'is_used', 'expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('two_factor_codes');
}
