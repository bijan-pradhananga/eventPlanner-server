import { Request, Response, NextFunction } from 'express';
import { RSVPService } from '../services/rsvpService';
import { logger } from '../utils/logger';

export class RSVPController {
  /**
   * Create or update RSVP for an event
   */
  static async upsertRSVP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
        return;
      }

      const eventId = parseInt(req.params.eventId);
      const { status } = req.body;

      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' },
        });
        return;
      }

      const rsvp = await RSVPService.upsertRSVP(eventId, req.user.id, status);

      res.status(200).json({
        success: true,
        data: { rsvp },
      });
    } catch (error) {
      logger.error('RSVP upsert failed:', error);

      if (error instanceof Error) {
        if (error.message === 'Event not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
        } else if (error.message.includes('Cannot RSVP') || error.message.includes('permission')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  /**
   * Get user's RSVP for a specific event
   */
  static async getUserRSVP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
        return;
      }

      const eventId = parseInt(req.params.eventId);

      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' },
        });
        return;
      }

      const rsvp = await RSVPService.getUserRSVP(eventId, req.user.id);

      res.status(200).json({
        success: true,
        data: { rsvp },
      });
    } catch (error) {
      logger.error('Get user RSVP failed:', error);
      next(error);
    }
  }

  /**
   * Get all RSVPs for an event
   */
  static async getEventRSVPs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = parseInt(req.params.eventId);

      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' },
        });
        return;
      }

      const result = await RSVPService.getEventRSVPs(eventId, req.user?.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Get event RSVPs failed:', error);

      if (error instanceof Error) {
        if (error.message === 'Event not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message },
          });
        } else if (error.message.includes('permission')) {
          res.status(403).json({
            success: false,
            error: { message: error.message },
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  /**
   * Get all events user has RSVP'd to
   */
  static async getUserRSVPs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
        return;
      }

      const rsvps = await RSVPService.getUserRSVPs(req.user.id);

      res.status(200).json({
        success: true,
        data: { rsvps },
      });
    } catch (error) {
      logger.error('Get user RSVPs failed:', error);
      next(error);
    }
  }

  /**
   * Delete RSVP (cancel)
   */
  static async deleteRSVP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'Unauthorized' },
        });
        return;
      }

      const eventId = parseInt(req.params.eventId);

      if (isNaN(eventId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid event ID' },
        });
        return;
      }

      await RSVPService.deleteRSVP(eventId, req.user.id);

      res.status(200).json({
        success: true,
        data: { message: 'RSVP cancelled successfully' },
      });
    } catch (error) {
      logger.error('Delete RSVP failed:', error);

      if (error instanceof Error && error.message === 'RSVP not found') {
        res.status(404).json({
          success: false,
          error: { message: error.message },
        });
      } else {
        next(error);
      }
    }
  }
}
