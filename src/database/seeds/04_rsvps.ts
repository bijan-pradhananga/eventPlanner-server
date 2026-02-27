import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('rsvps').del();

  const users = await knex('users').select('id');
  const events = await knex('events')
    .select('id', 'event_type', 'user_id');

  if (users.length === 0) {
    throw new Error('No users found. Run users seeder first.');
  }

  if (events.length === 0) {
    throw new Error('No events found. Run events seeder first.');
  }

  const statuses: Array<'yes' | 'no' | 'maybe'> = ['yes', 'no', 'maybe'];

  const rsvps: Array<{
    event_id: number;
    user_id: number;
    status: 'yes' | 'no' | 'maybe';
    created_at: Date;
    updated_at: Date;
  }> = [];

  for (const event of events) {

    // ── PRIVATE EVENTS ─────────────────────────────
    if (event.event_type === 'private') {
      // Only owner can RSVP
      rsvps.push({
        event_id: event.id,
        user_id: event.user_id,
        status: 'yes',
        created_at: new Date(),
        updated_at: new Date(),
      });

      continue;
    }

    // ── PUBLIC EVENTS ──────────────────────────────

    // Random number of attendees (3–10)
    const attendeeCount = Math.floor(Math.random() * 8) + 3;

    // Shuffle users
    const shuffledUsers = [...users]
      .filter(u => u.id !== event.user_id) // skip owner
      .sort(() => 0.5 - Math.random());

    const selectedUsers = shuffledUsers.slice(0, attendeeCount);

    for (const user of selectedUsers) {
      rsvps.push({
        event_id: event.id,
        user_id: user.id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  if (rsvps.length > 0) {
    await knex('rsvps').insert(rsvps);
    console.log(`✓ Inserted ${rsvps.length} RSVP records`);
  }
}