import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('event_tags').del();
  await knex('events').del();

  // Fetch user and tag IDs inserted by previous seeders
  const users = await knex('users').select('id').orderBy('id');
  const tags = await knex('tags').select('id', 'name').orderBy('id');

  if (users.length === 0) {
    throw new Error('No users found. Run the users seeder first.');
  }

  const [alice, bob, carol, david, eva] = users.map((u: { id: number }) => u.id);

  // Map tag names to IDs for readability
  const tagMap: Record<string, number> = {};
  for (const tag of tags as { id: number; name: string }[]) {
    tagMap[tag.name] = tag.id;
  }

  // ── Events ──────────────────────────────────────────────────────────────────
  await knex('events').insert([
      // Future events
      {
        title: 'Annual Tech Conference 2026',
        description: 'A full-day conference covering the latest trends in software development, AI, and cloud computing.',
        event_date: new Date('2026-03-15 09:00:00'),
        event_end_date: new Date('2026-03-15 18:00:00'),
        location: 'Convention Center, New York',
        event_type: 'public',
        user_id: alice
      },
      {
        title: 'JavaScript Workshop: Advanced Patterns',
        description: 'Hands-on workshop exploring advanced JavaScript design patterns and modern tooling.',
        event_date: new Date('2026-03-22 10:00:00'),
        event_end_date: new Date('2026-03-22 16:00:00'),
        location: 'Tech Hub, San Francisco',
        event_type: 'public',
        user_id: bob
      },
      {
        title: "Alice's Birthday Celebration",
        description: 'Join us for a fun evening to celebrate Alice\'s birthday!',
        event_date: new Date('2026-04-05 19:00:00'),
        event_end_date: new Date('2026-04-05 23:00:00'),
        location: 'The Grand Ballroom, Chicago',
        event_type: 'private',
        user_id: alice
      },
      {
        title: 'Startup Networking Night',
        description: 'Connect with founders, investors, and innovators in a relaxed evening setting.',
        event_date: new Date('2026-04-12 18:30:00'),
        event_end_date: new Date('2026-04-12 21:30:00'),
        location: 'Innovation Lounge, Austin',
        event_type: 'public',
        user_id: carol
      },
      {
        title: 'Spring Music Festival',
        description: 'An outdoor music festival featuring local and national artists across three stages.',
        event_date: new Date('2026-04-25 12:00:00'),
        event_end_date: new Date('2026-04-26 22:00:00'),
        location: 'Riverside Park, Nashville',
        event_type: 'public',
        user_id: eva
      },
      {
        title: 'Team Quarterly Meeting Q2',
        description: 'Internal Q2 planning and review session for all department leads.',
        event_date: new Date('2026-05-04 09:00:00'),
        event_end_date: new Date('2026-05-04 12:00:00'),
        location: 'Head Office, Seattle',
        event_type: 'private',
        user_id: david
      },
      {
        title: 'Web Development Bootcamp Kickoff',
        description: 'Orientation day for the 12-week full-stack web development bootcamp cohort.',
        event_date: new Date('2026-05-11 08:30:00'),
        event_end_date: new Date('2026-05-11 17:00:00'),
        location: 'Code Academy, Boston',
        event_type: 'public',
        user_id: bob
      },
      {
        title: 'Charity Sports Tournament',
        description: 'Annual charity sports event with proceeds going to local youth programs.',
        event_date: new Date('2026-05-23 09:00:00'),
        event_end_date: new Date('2026-05-23 17:00:00'),
        location: 'City Sports Complex, Denver',
        event_type: 'public',
        user_id: carol
      },
      {
        title: 'David & Emma Wedding Reception',
        description: 'Reception dinner following the wedding ceremony. RSVP required.',
        event_date: new Date('2026-06-14 17:00:00'),
        event_end_date: new Date('2026-06-14 23:59:00'),
        location: 'Lakeside Manor, Orlando',
        event_type: 'private',
        user_id: david
      },
      {
        title: 'Open Source Contributors Meetup',
        description: 'Monthly meetup for open-source enthusiasts to share projects and collaborate.',
        event_date: new Date('2026-06-20 14:00:00'),
        event_end_date: new Date('2026-06-20 17:00:00'),
        location: 'Community Library, Portland',
        event_type: 'public',
        user_id: eva
      },
      // Past events
      {
        title: 'Product Launch: EventPlanner v1.0',
        description: 'Official launch event for EventPlanner, including demos and Q&A.',
        event_date: new Date('2026-01-20 10:00:00'),
        event_end_date: new Date('2026-01-20 13:00:00'),
        location: 'Online (Zoom)',
        event_type: 'public',
        user_id: alice
      },
      {
        title: 'New Year Networking Brunch',
        description: 'Kick off the new year with fellow professionals over brunch.',
        event_date: new Date('2026-01-10 10:30:00'),
        event_end_date: new Date('2026-01-10 13:00:00'),
        location: 'The Rooftop Café, Miami',
        event_type: 'public',
        user_id: carol
      }
    ]);

  // MySQL doesn't support RETURNING – query inserted IDs in insertion order
  const eventRows = await knex('events').select('id').orderBy('id');
  const eventIds: number[] = eventRows.map((r: { id: number }) => r.id);

  const [
    techConf, jsWorkshop, birthday, networking, musicFest,
    teamMeeting, bootcamp, sports, wedding, openSource,
    productLaunch, newYearBrunch
  ] = eventIds;

  // ── Event–Tag Associations ───────────────────────────────────────────────────
  const eventTagPairs: { event_id: number; tag_id: number }[] = [];

  const link = (eventId: number, ...tagNames: string[]) => {
    for (const name of tagNames) {
      if (tagMap[name] !== undefined) {
        eventTagPairs.push({ event_id: eventId, tag_id: tagMap[name] });
      }
    }
  };

  link(techConf,       'Conference', 'Educational', 'Networking', 'Business');
  link(jsWorkshop,     'Workshop', 'Educational', 'Business');
  link(birthday,       'Birthday', 'Party', 'Social');
  link(networking,     'Networking', 'Business', 'Social');
  link(musicFest,      'Music', 'Social', 'Party');
  link(teamMeeting,    'Meeting', 'Business');
  link(bootcamp,       'Educational', 'Workshop', 'Business');
  link(sports,         'Sports', 'Social');
  link(wedding,        'Wedding', 'Social', 'Party');
  link(openSource,     'Networking', 'Educational', 'Social');
  link(productLaunch,  'Business', 'Conference', 'Networking');
  link(newYearBrunch,  'Networking', 'Social', 'Party');

  await knex('event_tags').insert(eventTagPairs);
}
