import { db } from '../database/connection';
import { Tag } from '../types';
import { logger } from '../utils/logger';

export class TagService {
  static async getAllTags(): Promise<Tag[]> {
    const tags = await db('tags').select('*').orderBy('name', 'asc');
    return tags;
  }

  static async createTag(name: string, color?: string): Promise<Tag> {
    // Check if tag with this name already exists
    const existingTag = await db('tags').where('name', name).first();
    if (existingTag) {
      throw new Error('Tag with this name already exists');
    }

    const [tagId] = await db('tags').insert({
      name,
      color: color || '#3B82F6' // Default blue color
    });

    const tag = await db('tags').where('id', tagId).first();
    if (!tag) {
      throw new Error('Failed to create tag');
    }

    logger.info(`Tag created successfully: ${tag.name} (ID: ${tagId})`);
    return tag;
  }

  static async updateTag(tagId: number, name?: string, color?: string): Promise<Tag> {
    const existingTag = await db('tags').where('id', tagId).first();
    if (!existingTag) {
      throw new Error('Tag not found');
    }

    // Check if another tag with the new name exists (if name is being changed)
    if (name && name !== existingTag.name) {
      const duplicateTag = await db('tags').where('name', name).first();
      if (duplicateTag) {
        throw new Error('Tag with this name already exists');
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      await db('tags').where('id', tagId).update(updateData);
    }

    const updatedTag = await db('tags').where('id', tagId).first();
    if (!updatedTag) {
      throw new Error('Failed to update tag');
    }

    logger.info(`Tag updated successfully: ${updatedTag.name} (ID: ${tagId})`);
    return updatedTag;
  }

  static async deleteTag(tagId: number): Promise<void> {
    const tag = await db('tags').where('id', tagId).first();
    if (!tag) {
      throw new Error('Tag not found');
    }

    // Check if tag is being used by any events
    const eventCount = await db('event_tags').where('tag_id', tagId).count('id as count').first();
    if (eventCount && parseInt(eventCount.count as string) > 0) {
      throw new Error('Cannot delete tag that is being used by events');
    }

    await db('tags').where('id', tagId).del();

    logger.info(`Tag deleted successfully: ${tag.name} (ID: ${tagId})`);
  }

  static async getPopularTags(limit: number = 10): Promise<Array<Tag & { usage_count: number }>> {
    const popularTags = await db('tags')
      .leftJoin('event_tags', 'tags.id', 'event_tags.tag_id')
      .select('tags.*', db.raw('COUNT(event_tags.id) as usage_count'))
      .groupBy('tags.id')
      .orderBy('usage_count', 'desc')
      .limit(limit);

    return popularTags.map(tag => ({
      ...tag,
      usage_count: parseInt(tag.usage_count as string)
    }));
  }
}