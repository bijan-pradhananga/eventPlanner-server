import { db } from '../database/connection';
import { Event, CreateEventRequest, UpdateEventRequest, EventsQueryParams, ApiResponse } from '../types';
import { logger } from '../utils/logger';

/** Convert a Date or ISO string to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS) */
function toMySQLDatetime(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
}

export class EventService {
    /**
     * Get dashboard stats for a user: total events, public, private, upcoming
     */
    static async getDashboardStats(userId: number) {
      // Total events
      const totalEventsResult = await db('events').where('user_id', userId).count('id as total').first();
      const totalEvents = Number(totalEventsResult?.total || 0);

      // Total public events
      const publicEventsResult = await db('events').where('user_id', userId).where('event_type', 'public').count('id as total').first();
      const totalPublicEvents = Number(publicEventsResult?.total || 0);

      // Total private events
      const privateEventsResult = await db('events').where('user_id', userId).where('event_type', 'private').count('id as total').first();
      const totalPrivateEvents = Number(privateEventsResult?.total || 0);

      // Upcoming events
      const now = new Date();
      const upcomingEventsResult = await db('events')
        .where('user_id', userId)
        .where('event_date', '>=', now)
        .count('id as total')
        .first();
      const totalUpcomingEvents = Number(upcomingEventsResult?.total || 0);

      return {
        total_events: totalEvents,
        total_public_events: totalPublicEvents,
        total_private_events: totalPrivateEvents,
        total_upcoming_events: totalUpcomingEvents
      };
    }
    
  static async createEvent(userId: number, eventData: CreateEventRequest): Promise<Event> {
    const trx = await db.transaction();

    try {
      // Create event
      const [eventId] = await trx('events').insert({
        title: eventData.title,
        description: eventData.description,
        event_date: toMySQLDatetime(eventData.event_date),
        event_end_date: toMySQLDatetime(eventData.event_end_date),
        location: eventData.location,
        event_type: eventData.event_type,
        user_id: userId
      });

      // Add tags if provided
      if (eventData.tag_ids && eventData.tag_ids.length > 0) {
        const eventTagData = eventData.tag_ids.map(tagId => ({
          event_id: eventId,
          tag_id: tagId
        }));

        await trx('event_tags').insert(eventTagData);
      }

      await trx.commit();

      // Fetch the created event with tags
      const event = await this.getEventById(eventId, userId);
      if (!event) {
        throw new Error('Failed to create event');
      }

      logger.info(`Event created successfully: ${event.title} (ID: ${eventId})`);
      return event;
    } catch (error) {
      await trx.rollback();
      logger.error('Failed to create event:', error);
      throw error;
    }
  }

  static async getEvents(
    queryParams: EventsQueryParams,
    userId?: number,
    creatorUserId?: number
  ): Promise<ApiResponse<Event[]>> {

    const {
      page = 1,
      limit = 10,
      search,
      tag_ids,
      event_type,
      upcoming,
      past,
      sort_by = 'event_date',
      sort_order = 'asc'
    } = queryParams;

    const offset = (page - 1) * limit;
    const now = new Date();

    // BASE QUERY (no select, no group)
    const baseQuery = db('events')
      .leftJoin('event_tags', 'events.id', 'event_tags.event_id')
      .leftJoin('tags', 'event_tags.tag_id', 'tags.id')
      .leftJoin('users', 'events.user_id', 'users.id');

    // FILTERS

    if (creatorUserId) {
      baseQuery.where('events.user_id', creatorUserId);
    }

    if (event_type) {
      baseQuery.where('events.event_type', event_type);
    }

    if (userId) {
      baseQuery.where(function () {
        this.where('events.event_type', 'public')
          .orWhere('events.user_id', userId);
      });
    } else {
      baseQuery.where('events.event_type', 'public');
    }

    if (upcoming && !past) {
      baseQuery.where('events.event_date', '>=', now);
    }

    if (past && !upcoming) {
      baseQuery.where('events.event_date', '<', now);
    }

    if (search) {
      baseQuery.where(function () {
        this.where('events.title', 'like', `%${search}%`)
          .orWhere('events.description', 'like', `%${search}%`)
          .orWhere('events.location', 'like', `%${search}%`);
      });
    }

    if (tag_ids) {
      const tagIdArray = tag_ids.split(',').map(id => parseInt(id.trim()));
      baseQuery.whereIn('event_tags.tag_id', tagIdArray);
    }

    // COUNT QUERY
    const countResult = await baseQuery
      .clone()
      .clearSelect()
      .countDistinct('events.id as total')
      .first();

    const total = Number(countResult?.total || 0);

    // DATA QUERY
    const validSortColumns = ['event_date', 'created_at', 'title'];
    const sortColumn = validSortColumns.includes(sort_by)
      ? sort_by
      : 'event_date';

    const sortDirection = sort_order === 'desc' ? 'desc' : 'asc';

    const events = await baseQuery
      .clone()
      .select(
        'events.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name',
        db.raw('GROUP_CONCAT(DISTINCT tags.id) as tag_ids'),
        db.raw('GROUP_CONCAT(DISTINCT tags.name) as tag_names'),
        db.raw('GROUP_CONCAT(DISTINCT tags.color) as tag_colors')
      )
      .groupBy('events.id')
      .orderBy(`events.${sortColumn}`, sortDirection)
      .limit(limit)
      .offset(offset);

    // TRANSFORM
    const transformedEvents = events.map(event => ({
      ...event,
      tags: event.tag_ids
        ? {
          ids: event.tag_ids.split(',').map((id: string) => parseInt(id)),
          names: event.tag_names.split(','),
          colors: event.tag_colors.split(',')
        }
        : { ids: [], names: [], colors: [] },
      creator: {
        first_name: event.creator_first_name,
        last_name: event.creator_last_name
      }
    }));

    transformedEvents.forEach(event => {
      delete event.tag_ids;
      delete event.tag_names;
      delete event.tag_colors;
      delete event.creator_first_name;
      delete event.creator_last_name;
    });

    return {
      success: true,
      data: transformedEvents,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  static async getEventById(eventId: number, userId?: number): Promise<Event | null> {
    const event = await db('events')
      .leftJoin('event_tags', 'events.id', 'event_tags.event_id')
      .leftJoin('tags', 'event_tags.tag_id', 'tags.id')
      .leftJoin('users', 'events.user_id', 'users.id')
      .select(
        'events.*',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name',
        'users.email as creator_email',
        db.raw('GROUP_CONCAT(DISTINCT tags.id) as tag_ids'),
        db.raw('GROUP_CONCAT(DISTINCT tags.name) as tag_names'),
        db.raw('GROUP_CONCAT(DISTINCT tags.color) as tag_colors')
      )
      .where('events.id', eventId)
      .groupBy('events.id')
      .first();

    if (!event) {
      return null;
    }

    // Check if user has permission to view this event
    if (event.event_type === 'private' && userId !== event.user_id) {
      return null;
    }

    // Transform the result to include tags as arrays
    const transformedEvent = {
      ...event,
      tags: event.tag_ids ? {
        ids: event.tag_ids.split(',').map((id: string) => parseInt(id)),
        names: event.tag_names.split(','),
        colors: event.tag_colors.split(',')
      } : { ids: [], names: [], colors: [] },
      creator: {
        first_name: event.creator_first_name,
        last_name: event.creator_last_name,
        email: event.creator_email
      }
    };

    // Remove the raw tag data from the response
    delete transformedEvent.tag_ids;
    delete transformedEvent.tag_names;
    delete transformedEvent.tag_colors;
    delete transformedEvent.creator_first_name;
    delete transformedEvent.creator_last_name;
    delete transformedEvent.creator_email;

    return transformedEvent;
  }

  static async updateEvent(eventId: number, userId: number, eventData: UpdateEventRequest): Promise<Event> {
    // Check if event exists and user owns it
    const existingEvent = await db('events')
      .where('id', eventId)
      .where('user_id', userId)
      .first();

    if (!existingEvent) {
      throw new Error('Event not found or you do not have permission to edit it');
    }

    const trx = await db.transaction();

    try {
      // Update event
      const updateData: any = {};
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.event_date !== undefined) updateData.event_date = toMySQLDatetime(eventData.event_date);
      if (eventData.event_end_date !== undefined) updateData.event_end_date = toMySQLDatetime(eventData.event_end_date);
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.event_type !== undefined) updateData.event_type = eventData.event_type;

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date();
        await trx('events').where('id', eventId).update(updateData);
      }

      // Update tags if provided
      if (eventData.tag_ids !== undefined) {
        // Remove existing tags
        await trx('event_tags').where('event_id', eventId).del();

        // Add new tags
        if (eventData.tag_ids.length > 0) {
          const eventTagData = eventData.tag_ids.map(tagId => ({
            event_id: eventId,
            tag_id: tagId
          }));

          await trx('event_tags').insert(eventTagData);
        }
      }

      await trx.commit();

      // Fetch the updated event
      const updatedEvent = await this.getEventById(eventId, userId);
      if (!updatedEvent) {
        throw new Error('Failed to update event');
      }

      logger.info(`Event updated successfully: ${updatedEvent.title} (ID: ${eventId})`);
      return updatedEvent;
    } catch (error) {
      await trx.rollback();
      logger.error('Failed to update event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId: number, userId: number): Promise<void> {
    // Check if event exists and user owns it
    const event = await db('events')
      .where('id', eventId)
      .where('user_id', userId)
      .first();

    if (!event) {
      throw new Error('Event not found or you do not have permission to delete it');
    }

    // Delete event (cascade will handle related records)
    await db('events').where('id', eventId).del();

    logger.info(`Event deleted successfully: ${event.title} (ID: ${eventId})`);
  }
}