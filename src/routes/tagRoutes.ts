import { Router } from 'express';
import { TagController } from '../controllers/tagController';
import { validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { createTagSchema, updateTagSchema } from '../validation/tagValidation';

const router = Router();

// Public routes
router.get('/', TagController.getAllTags);
router.get('/popular', TagController.getPopularTags);

// Protected routes (only authenticated users can manage tags)
router.post('/', authenticateToken, validate(createTagSchema), TagController.createTag);
router.put('/:id', authenticateToken, validate(updateTagSchema), TagController.updateTag);
router.delete('/:id', authenticateToken, TagController.deleteTag);

export default router;