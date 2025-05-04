import { Request, Response } from 'express';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Base controller with utility methods for consistent API responses
 */
export class BaseController {
  /**
   * Send a successful response
   */
  protected sendSuccess<T>(res: Response, message: string, data?: T, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  
  /**
   * Send an error response
   */
  protected sendError(res: Response, message: string, statusCode: number = 500, error?: any): void {
    res.status(statusCode).json({
      success: false,
      message,
      error: error?.toString()
    });
  }
  
  /**
   * Handle common validation for propertyId
   * Returns true if validation passes, false if it fails (and response is sent)
   */
  protected validatePropertyId(req: Request, res: Response): boolean {
    const propertyId = req.query.propertyId as string;
    
    if (!propertyId) {
      this.sendError(res, 'Property ID is required', 400);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get user ID from authenticated request
   */
  protected getUserId(req: Request): string {
    return (req as any).user?.id;
  }
  
  /**
   * Handle common validation for required message
   * Returns true if validation passes, false if it fails (and response is sent)
   */
  protected validateMessage(req: Request, res: Response): boolean {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      this.sendError(res, 'Message is required', 400);
      return false;
    }
    
    return true;
  }
  
  /**
   * Handle common error mapping
   */
  protected getErrorStatusCode(error: Error): number {
    const message = error.message.toLowerCase();
    
    if (message.includes('not found') || message.includes('not set')) {
      return 400;
    }
    
    return 500;
  }
} 