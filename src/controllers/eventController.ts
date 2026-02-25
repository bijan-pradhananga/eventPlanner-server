import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/eventService';
import { CreateEventRequest, UpdateEventRequest, EventsQueryParams } from '../types';
import { logger } from '../utils/logger';

export class EventController {

    static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: { message: 'Unauthorized' }
          });
          return;
        }

        const stats = await EventService.getDashboardStats(req.user.id);
        res.status(200).json({
          success: true,
          data: stats
        });
      } catch (error) {
        logger.error('Get dashboard stats failed:', error);
        next(error);
      }
    }

  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        });
        return;
      }

      const eventData: CreateEventRequest = req.body;
      const event = await EventService.createEvent(req.user.id, eventData);

      res.status(201).json({
        success: true,
        data: { event }
      });
    } catch (error) {
      logger.error('Create event failed:', error);
      next(error);
    }
  }

  static async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams: EventsQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 10, 100), // Cap at 100
        search: req.query.search as string,
        tag_ids: req.query.tag_ids as string,
        event_type: req.query.event_type as 'public' | 'private',
        upcoming: req.query.upcoming === 'true',
        past: req.query.past === 'true',
        sort_by: req.query.sort_by as 'event_date' | 'created_at' | 'title',
        sort_order: req.query.sort_order as 'asc' | 'desc'
      };

      const result = await EventService.getEvents(queryParams, req.user?.id);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get events failed:', error);
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' }
        });
        return;
      }

      const event = await EventService.getEventById(eventId, req.user?.id);

      if (!event) {
        res.status(404).json({
          success: false,
          error: { message: 'Event not found' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error) {
      logger.error('Get event by ID failed:', error);
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        });
        return;
      }

      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' }
        });
        return;
      }

      const eventData: UpdateEventRequest = req.body;
      const event = await EventService.updateEvent(eventId, req.user.id, eventData);

      res.status(200).json({
        success: true,
        data: { event }
      });
    } catch (error) {
      logger.error('Update event failed:', error);
      
      if (error instanceof Error && error.message.includes('not found or you do not have permission')) {
        res.status(404).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        next(error);
      }
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        });
        return;
      }

      const eventId = parseInt(req.params.id);
      
      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' }
        });
        return;
      }

      await EventService.deleteEvent(eventId, req.user.id);

      res.status(200).json({
        success: true,
        data: { message: 'Event deleted successfully' }
      });
    } catch (error) {
      logger.error('Delete event failed:', error);
      
      if (error instanceof Error && error.message.includes('not found or you do not have permission')) {
        res.status(404).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        next(error);
      }
    }
  }

  static async getMyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' }
        });
        return;
      }

      const queryParams: EventsQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: Math.min(parseInt(req.query.limit as string) || 10, 100), // Cap at 100
        search: req.query.search as string,
        tag_ids: req.query.tag_ids as string,
        upcoming: req.query.upcoming === 'true',
        past: req.query.past === 'true',
        sort_by: req.query.sort_by as 'event_date' | 'created_at' | 'title',
        sort_order: req.query.sort_order as 'asc' | 'desc'
      };

      // Pass creatorUserId so DB filters to only this user's events before pagination
      const result = await EventService.getEvents(queryParams, req.user.id, req.user.id);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Get my events failed:', error);
      next(error);
    }
  }
}