import { Router } from 'express';
import { RSVPController } from '../controllers/rsvpController';
import { validate } from '../middleware/validation';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { rsvpSchema } from '../validation/rsvpValidation';

const router = Router();

// Get all events user has RSVP'd to
router.get('/my-rsvps', authenticateToken, RSVPController.getUserRSVPs);

// Get all RSVPs for a specific event
router.get('/events/:eventId', optionalAuth, RSVPController.getEventRSVPs);

// Get user's RSVP for a specific event
router.get('/events/:eventId/my-rsvp', authenticateToken, RSVPController.getUserRSVP);

// Create or update RSVP for an event
router.post('/events/:eventId', authenticateToken, validate(rsvpSchema), RSVPController.upsertRSVP);

// Delete RSVP (cancel)
router.delete('/events/:eventId', authenticateToken, RSVPController.deleteRSVP);

export default router;
