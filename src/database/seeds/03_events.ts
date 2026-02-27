import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('event_tags').del();
  await knex('events').del();

  const users = await knex('users').select('id');
  const tags = await knex('tags').select('id', 'name');

  if (users.length === 0) {
    throw new Error('No users found. Run the users seeder first.');
  }

  if (tags.length === 0) {
    throw new Error('No tags found. Run the tags seeder first.');
  }

  const eventTitles = [
    'Tech Conference',
    'Startup Meetup',
    'Music Festival',
    'Workshop Series',
    'Networking Night',
    'Product Launch',
    'Business Summit',
    'Charity Run',
    'Web Dev Bootcamp',
    'Innovation Expo',
    'Birthday Bash',
    'Corporate Meeting'
  ];

  const locations = [
    'New York',
    'San Francisco',
    'Chicago',
    'Austin',
    'Boston',
    'Seattle',
    'Denver',
    'Miami',
    'Portland',
    'Online (Zoom)'
  ];

  const events = [];

  for (let i = 1; i <= 50; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)].id;

    // Random past or future date
    const isFuture = Math.random() > 0.4;
    const baseDate = new Date();
    const randomDays = Math.floor(Math.random() * 60);

    const eventDate = new Date(
      isFuture
        ? baseDate.setDate(baseDate.getDate() + randomDays)
        : baseDate.setDate(baseDate.getDate() - randomDays)
    );

    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(eventEndDate.getHours() + 3);

    events.push({
      title: `${eventTitles[Math.floor(Math.random() * eventTitles.length)]} ${i}`,
      description: 'This is a sample generated event description.',
      event_date: eventDate,
      event_end_date: eventEndDate,
      location: locations[Math.floor(Math.random() * locations.length)],
      event_type: Math.random() > 0.5 ? 'public' : 'private',
      user_id: randomUser,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  await knex('events').insert(events);

  // Fetch inserted event IDs
  const eventRows = await knex('events').select('id').orderBy('id');
  const eventTagPairs: { event_id: number; tag_id: number }[] = [];

  for (const event of eventRows) {
    // assign 1–3 random tags
    const shuffledTags = [...tags].sort(() => 0.5 - Math.random());
    const selectedTags = shuffledTags.slice(0, Math.floor(Math.random() * 3) + 1);

    for (const tag of selectedTags) {
      eventTagPairs.push({
        event_id: event.id,
        tag_id: tag.id
      });
    }
  }

  await knex('event_tags').insert(eventTagPairs);
}