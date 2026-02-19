import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('tags').del();

  // Inserts seed entries
  return knex('tags').insert([
    { name: 'Birthday', color: '#FF6B6B' },
    { name: 'Conference', color: '#4ECDC4' },
    { name: 'Workshop', color: '#45B7D1' },
    { name: 'Meeting', color: '#96CEB4' },
    { name: 'Wedding', color: '#FFEAA7' },
    { name: 'Party', color: '#DDA0DD' },
    { name: 'Business', color: '#74B9FF' },
    { name: 'Social', color: '#55A3FF' },
    { name: 'Educational', color: '#26DE81' },
    { name: 'Networking', color: '#FD79A8' },
    { name: 'Sports', color: '#FDCB6E' },
    { name: 'Music', color: '#6C5CE7' }
  ]);
}