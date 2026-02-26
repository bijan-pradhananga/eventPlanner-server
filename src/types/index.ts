export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  email_verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: Date;
  event_end_date?: Date;
  location?: string;
  event_type: 'public' | 'private';
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface EventTag {
  id: number;
  event_id: number;
  tag_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  token: string;
  user_id: number;
  expires_at: Date;
  is_revoked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface EmailVerificationToken {
  id: number;
  token: string;
  user_id: number;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RSVP {
  id: number;
  event_id: number;
  user_id: number;
  status: 'yes' | 'no' | 'maybe';
  created_at: Date;
  updated_at: Date;
}

// Request/Response Types
export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date: Date;
  event_end_date?: Date;
  location?: string;
  event_type: 'public' | 'private';
  tag_ids?: number[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  event_date?: Date;
  event_end_date?: Date;
  location?: string;
  event_type?: 'public' | 'private';
  tag_ids?: number[];
}

export interface EventsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tag_ids?: string;
  event_type?: 'public' | 'private';
  upcoming?: boolean;
  past?: boolean;
  sort_by?: 'event_date' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface CreateRSVPRequest {
  status: 'yes' | 'no' | 'maybe';
}

// JWT Payload
export interface JWTPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    stack?: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Email Service Types
export interface EmailVerificationTemplateData {
  firstName: string | undefined;
  verificationUrl: string;
  currentYear: number;
}

export interface EmailTemplate {
  html: string;
  text: string;
}