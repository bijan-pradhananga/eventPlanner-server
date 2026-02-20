import { Request, Response, NextFunction } from 'express';
import { TagService } from '../services/tagService';
import { logger } from '../utils/logger';

export class TagController {
  static async getAllTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await TagService.getAllTags();

      res.status(200).json({
        success: true,
        data: { tags }
      });
    } catch (error) {
      logger.error('Get all tags failed:', error);
      next(error);
    }
  }

  static async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, color } = req.body;
      const tag = await TagService.createTag(name, color);

      res.status(201).json({
        success: true,
        data: { tag }
      });
    } catch (error) {
      logger.error('Create tag failed:', error);
      
      if (error instanceof Error && error.message === 'Tag with this name already exists') {
        res.status(409).json({
          success: false,
          error: { message: error.message }
        });
      } else {
        next(error);
      }
    }
  }

  static async updateTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tagId = parseInt(req.params.id);
      
      if (isNaN(tagId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid tag ID' }
        });
        return;
      }

      const { name, color } = req.body;
      const tag = await TagService.updateTag(tagId, name, color);

      res.status(200).json({
        success: true,
        data: { tag }
      });
    } catch (error) {
      logger.error('Update tag failed:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Tag not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message }
          });
        } else if (error.message === 'Tag with this name already exists') {
          res.status(409).json({
            success: false,
            error: { message: error.message }
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  static async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tagId = parseInt(req.params.id);
      
      if (isNaN(tagId)) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid tag ID' }
        });
        return;
      }

      await TagService.deleteTag(tagId);

      res.status(200).json({
        success: true,
        data: { message: 'Tag deleted successfully' }
      });
    } catch (error) {
      logger.error('Delete tag failed:', error);
      
      if (error instanceof Error) {
        if (error.message === 'Tag not found') {
          res.status(404).json({
            success: false,
            error: { message: error.message }
          });
        } else if (error.message === 'Cannot delete tag that is being used by events') {
          res.status(400).json({
            success: false,
            error: { message: error.message }
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  static async getPopularTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Cap at 50
      const tags = await TagService.getPopularTags(limit);

      res.status(200).json({
        success: true,
        data: { tags }
      });
    } catch (error) {
      logger.error('Get popular tags failed:', error);
      next(error);
    }
  }
}