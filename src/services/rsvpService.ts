import { db } from '../database/connection';
import { RSVP } from '../types';
import { logger } from '../utils/logger';

export class RSVPService {
  /**
   * Create or update RSVP for an event
   */
  static async upsertRSVP(
    eventId: number,
    userId: number,
    status: 'yes' | 'no' | 'maybe'
  ): Promise<RSVP> {
    // Check if event exists
    const event = await db('events').where('id', eventId).first();
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if user can access this event (public or user is the owner)
    if (event.event_type === 'private' && event.user_id !== userId) {
      throw new Error('Cannot RSVP to a private event you do not own');
    }

    // Check if RSVP already exists
    const existingRSVP = await db('rsvps')
      .where('event_id', eventId)
      .where('user_id', userId)
      .first();

    if (existingRSVP) {
      // Update existing RSVP
      await db('rsvps')
        .where('id', existingRSVP.id)
        .update({
          status,
          updated_at: new Date(),
        });

      const updatedRSVP = await db('rsvps').where('id', existingRSVP.id).first();
      logger.info(`RSVP updated: User ${userId} -> ${status} for event ${eventId}`);
      return updatedRSVP;
    } else {
      // Create new RSVP
      const [rsvpId] = await db('rsvps').insert({
        event_id: eventId,
        user_id: userId,
        status,
      });

      const newRSVP = await db('rsvps').where('id', rsvpId).first();
      logger.info(`RSVP created: User ${userId} -> ${status} for event ${eventId}`);
      return newRSVP;
    }
  }

  /**
   * Get user's RSVP for a specific event
   */
  static async getUserRSVP(eventId: number, userId: number): Promise<RSVP | null> {
    const rsvp = await db('rsvps')
      .where('event_id', eventId)
      .where('user_id', userId)
      .first();

    return rsvp || null;
  }

  /**
   * Get all RSVPs for an event with user details
   */
  static async getEventRSVPs(eventId: number, userId?: number) {
    // Check if event exists and user has access
    const event = await db('events').where('id', eventId).first();
    if (!event) {
      throw new Error('Event not found');
    }

    // Check access for private events
    if (event.event_type === 'private' && (!userId || event.user_id !== userId)) {
      throw new Error('You do not have permission to view RSVPs for this event');
    }

    const rsvps = await db('rsvps')
      .join('users', 'rsvps.user_id', 'users.id')
      .where('rsvps.event_id', eventId)
      .select(
        'rsvps.id',
        'rsvps.event_id',
        'rsvps.user_id',
        'rsvps.status',
        'rsvps.created_at',
        'rsvps.updated_at',
        'users.first_name',
        'users.last_name',
        'users.email'
      )
      .orderBy('rsvps.created_at', 'desc');

    // Group by status for summary
    const summary = {
      yes: rsvps.filter(r => r.status === 'yes').length,
      no: rsvps.filter(r => r.status === 'no').length,
      maybe: rsvps.filter(r => r.status === 'maybe').length,
      total: rsvps.length,
    };

    return {
      rsvps: rsvps.map(rsvp => ({
        id: rsvp.id,
        event_id: rsvp.event_id,
        user_id: rsvp.user_id,
        status: rsvp.status,
        created_at: rsvp.created_at,
        updated_at: rsvp.updated_at,
        user: {
          first_name: rsvp.first_name,
          last_name: rsvp.last_name,
          email: rsvp.email,
        },
      })),
      summary,
    };
  }

  /**
   * Get all events user has RSVP'd to
   */
  static async getUserRSVPs(userId: number) {
    const rsvps = await db('rsvps')
      .join('events', 'rsvps.event_id', 'events.id')
      .join('users', 'events.user_id', 'users.id')
      .where('rsvps.user_id', userId)
      .select(
        'rsvps.id',
        'rsvps.event_id',
        'rsvps.status',
        'rsvps.created_at',
        'rsvps.updated_at',
        'events.title',
        'events.description',
        'events.event_date',
        'events.event_end_date',
        'events.location',
        'events.event_type',
        'events.user_id as event_creator_id',
        'users.first_name as creator_first_name',
        'users.last_name as creator_last_name'
      )
      .orderBy('events.event_date', 'asc');

    return rsvps.map(rsvp => ({
      id: rsvp.id,
      status: rsvp.status,
      created_at: rsvp.created_at,
      updated_at: rsvp.updated_at,
      event: {
        id: rsvp.event_id,
        title: rsvp.title,
        description: rsvp.description,
        event_date: rsvp.event_date,
        event_end_date: rsvp.event_end_date,
        location: rsvp.location,
        event_type: rsvp.event_type,
        creator: {
          id: rsvp.event_creator_id,
          first_name: rsvp.creator_first_name,
          last_name: rsvp.creator_last_name,
        },
      },
    }));
  }

  /**
   * Delete RSVP (cancel RSVP)
   */
  static async deleteRSVP(eventId: number, userId: number): Promise<void> {
    const deleted = await db('rsvps')
      .where('event_id', eventId)
      .where('user_id', userId)
      .del();

    if (deleted === 0) {
      throw new Error('RSVP not found');
    }

    logger.info(`RSVP cancelled: User ${userId} for event ${eventId}`);
  }
}
