import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { validate, validateQuery } from '../middleware/validation';
import { authenticateToken, optionalAuth, requireEmailVerified } from '../middleware/auth';
import { createEventSchema, updateEventSchema, eventQuerySchema } from '../validation/eventValidation';

const router = Router();

// Public routes (with optional authentication for filtering)
router.get('/', optionalAuth, validateQuery(eventQuerySchema), EventController.getEvents);
router.get('/:id', optionalAuth, EventController.getEventById);

// User-specific routes
router.get('/my/dashboard', authenticateToken, EventController.getDashboardStats);
router.get('/my/events', authenticateToken, validateQuery(eventQuerySchema), EventController.getMyEvents);

// Protected routes (require email verification)
router.post('/', authenticateToken, requireEmailVerified, validate(createEventSchema), EventController.createEvent);
router.put('/:id', authenticateToken, requireEmailVerified, validate(updateEventSchema), EventController.updateEvent);
router.delete('/:id', authenticateToken, requireEmailVerified, EventController.deleteEvent);



export default router;