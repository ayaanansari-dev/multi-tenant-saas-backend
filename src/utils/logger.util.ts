import { Logger } from '../config/logger';

export class LoggerUtil {
  static info(message: string, meta?: any): void {
    Logger.info(message, meta);
  }
  
  static error(message: string, error?: any, meta?: any): void {
    Logger.error(message, { error: error?.message || error, ...meta });
  }
  
  static warn(message: string, meta?: any): void {
    Logger.warn(message, meta);
  }
  
  static debug(message: string, meta?: any): void {
    Logger.debug(message, meta);
  }
}