import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing RSVPs
  await knex('rsvps').del();

  // Fetch users and events
  const users = await knex('users').select('id', 'first_name').orderBy('id');
  const events = await knex('events')
    .select('id', 'title', 'event_type', 'user_id')
    .orderBy('id');

  if (users.length === 0) {
    throw new Error('No users found. Run the users seeder first.');
  }

  if (events.length === 0) {
    throw new Error('No events found. Run the events seeder first.');
  }

  const [alice, bob, carol, david, eva] = users.map((u: { id: number }) => u.id);

  // Helper to create RSVP entries
  const rsvps: Array<{ event_id: number; user_id: number; status: 'yes' | 'no' | 'maybe' }> = [];

  const addRsvp = (eventId: number, userId: number, status: 'yes' | 'no' | 'maybe') => {
    rsvps.push({ event_id: eventId, user_id: userId, status });
  };

  // Map events by index (using same order as events seeder)
  const [
    techConf,        // 0 - public, alice
    jsWorkshop,      // 1 - public, bob
    birthday,        // 2 - private, alice
    networking,      // 3 - public, carol
    musicFest,       // 4 - public, eva
    teamMeeting,     // 5 - private, david
    bootcamp,        // 6 - public, bob
    sports,          // 7 - public, carol
    wedding,         // 8 - private, david
    openSource,      // 9 - public, eva
    productLaunch,   // 10 - public, alice
    newYearBrunch    // 11 - public, carol
  ] = events.map((e: { id: number }) => e.id);

  // ── RSVPs for Public Events ──────────────────────────────────────────────────

  // Tech Conference - Popular event, lots of attendees
  addRsvp(techConf, bob, 'yes');
  addRsvp(techConf, carol, 'yes');
  addRsvp(techConf, david, 'yes');
  addRsvp(techConf, eva, 'maybe');

  // JavaScript Workshop - Developer-focused
  addRsvp(jsWorkshop, alice, 'yes');
  addRsvp(jsWorkshop, carol, 'yes');
  addRsvp(jsWorkshop, david, 'no');
  addRsvp(jsWorkshop, eva, 'yes');

  // Networking Night - Mixed responses
  addRsvp(networking, alice, 'yes');
  addRsvp(networking, bob, 'maybe');
  addRsvp(networking, david, 'yes');
  addRsvp(networking, eva, 'yes');

  // Music Festival - High interest
  addRsvp(musicFest, alice, 'yes');
  addRsvp(musicFest, bob, 'yes');
  addRsvp(musicFest, carol, 'yes');
  addRsvp(musicFest, david, 'maybe');

  // Bootcamp - Educational event
  addRsvp(bootcamp, alice, 'maybe');
  addRsvp(bootcamp, carol, 'yes');
  addRsvp(bootcamp, david, 'no');
  addRsvp(bootcamp, eva, 'yes');

  // Sports Tournament - Active participants
  addRsvp(sports, alice, 'yes');
  addRsvp(sports, bob, 'yes');
  addRsvp(sports, david, 'yes');
  addRsvp(sports, eva, 'no');

  // Open Source Meetup - Tech community
  addRsvp(openSource, alice, 'yes');
  addRsvp(openSource, bob, 'yes');
  addRsvp(openSource, carol, 'maybe');
  addRsvp(openSource, david, 'yes');

  // Product Launch - Company event
  addRsvp(productLaunch, bob, 'yes');
  addRsvp(productLaunch, carol, 'yes');
  addRsvp(productLaunch, david, 'maybe');
  addRsvp(productLaunch, eva, 'yes');

  // New Year Brunch - Social gathering
  addRsvp(newYearBrunch, alice, 'yes');
  addRsvp(newYearBrunch, bob, 'yes');
  addRsvp(newYearBrunch, david, 'no');
  addRsvp(newYearBrunch, eva, 'yes');

  // ── RSVPs for Private Events ─────────────────────────────────────────────────
  // Note: Only event owners can RSVP to their own private events in this system

  // Alice's Birthday - Alice's private event (owner can RSVP)
  addRsvp(birthday, alice, 'yes');

  // Team Meeting - David's private event (owner can RSVP)
  addRsvp(teamMeeting, david, 'yes');

  // Wedding Reception - David's private event (owner can RSVP)
  addRsvp(wedding, david, 'yes');

  // Insert all RSVPs
  if (rsvps.length > 0) {
    await knex('rsvps').insert(rsvps);
    console.log(`✓ Inserted ${rsvps.length} RSVP records`);
  }
}
