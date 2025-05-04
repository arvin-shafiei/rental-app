/**
 * Logger utility for consistent logging throughout the application
 */
export class Logger {
  private module: string;
  
  /**
   * Create a new logger instance for a specific module
   */
  constructor(module: string) {
    this.module = module;
  }
  
  /**
   * Format the log message with the module prefix
   */
  private format(message: string): string {
    return `[${this.module}] ${message}`;
  }
  
  /**
   * Log an informational message
   */
  info(message: string, data?: any): void {
    const formattedMessage = this.format(message);
    if (data !== undefined) {
      console.log(formattedMessage, typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.log(formattedMessage);
    }
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, data?: any): void {
    const formattedMessage = this.format(message);
    if (data !== undefined) {
      console.warn(formattedMessage, typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn(formattedMessage);
    }
  }
  
  /**
   * Log an error message
   */
  error(message: string, error?: any): void {
    const formattedMessage = this.format(message);
    
    if (error instanceof Error) {
      console.error(formattedMessage, error.message, error.stack);
    } else if (error !== undefined) {
      console.error(formattedMessage, typeof error === 'string' ? error : JSON.stringify(error));
    } else {
      console.error(formattedMessage);
    }
  }
  
  /**
   * Log the beginning of a method/function execution
   */
  methodStart(method: string, params?: any): void {
    if (params) {
      this.info(`${method} started with params:`, this.sanitizeParams(params));
    } else {
      this.info(`${method} started`);
    }
  }
  
  /**
   * Log the successful completion of a method/function
   */
  methodSuccess(method: string, result?: any): void {
    if (result !== undefined) {
      // For success results, we may want to limit what gets logged
      const logResult = typeof result === 'object' ? { success: true, ...this.truncateResult(result) } : result;
      this.info(`${method} completed successfully:`, logResult);
    } else {
      this.info(`${method} completed successfully`);
    }
  }
  
  /**
   * Log an error in a method/function
   */
  methodError(method: string, error: any): void {
    this.error(`${method} failed:`, error);
  }
  
  /**
   * Sanitize parameters for logging (remove sensitive data)
   * This method is public to allow services to sanitize data before logging
   */
  public sanitizeParams(params: any): any {
    if (typeof params !== 'object' || params === null) {
      return params;
    }
    
    // Create a copy to avoid modifying the original
    const sanitized = { ...params };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey', 'authorization'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    // Handle nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeParams(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Truncate large result objects for logging
   * This method is public to allow services to truncate data before logging
   */
  public truncateResult(result: any): any {
    if (typeof result !== 'object' || result === null) {
      return result;
    }
    
    // For arrays, limit the number of items
    if (Array.isArray(result)) {
      const length = result.length;
      if (length > 5) {
        return {
          type: 'Array',
          length,
          sample: result.slice(0, 3),
          note: `${length - 3} more items not shown`
        };
      }
      return result;
    }
    
    // For objects, create a summary
    const truncated: any = {};
    const keys = Object.keys(result);
    
    if (keys.length > 10) {
      keys.slice(0, 8).forEach(key => {
        truncated[key] = result[key];
      });
      truncated._summary = `${keys.length - 8} more properties not shown`;
    } else {
      keys.forEach(key => {
        // Handle nested objects/arrays recursively
        if (typeof result[key] === 'object' && result[key] !== null) {
          truncated[key] = this.truncateResult(result[key]);
        } else if (typeof result[key] === 'string' && result[key].length > 100) {
          truncated[key] = `${result[key].substring(0, 100)}... (truncated)`;
        } else {
          truncated[key] = result[key];
        }
      });
    }
    
    return truncated;
  }
} 