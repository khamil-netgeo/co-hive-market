import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  timestamp: string;
}

/**
 * Production logging hook that replaces console.log for better monitoring
 */
export function useProductionLogging() {
  const logToDatabase = useCallback(async (entry: LogEntry) => {
    try {
      // In production, this would send to a logging service like LogTail, Sentry, etc.
      // For now, we'll use Supabase functions as a basic logging endpoint
      await supabase.functions.invoke('log-audit', {
        body: {
          action: `LOG_${entry.level.toUpperCase()}`,
          entity_type: 'application_log',
          entity_id: null,
          metadata: {
            message: entry.message,
            context: entry.context,
            ...entry.metadata,
            timestamp: entry.timestamp
          }
        }
      });
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to log to service:', error);
    }
  }, []);

  const log = useCallback(async (
    level: LogLevel, 
    message: string, 
    context?: string, 
    metadata?: Record<string, any>
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const entry: LogEntry = {
      level,
      message,
      context,
      metadata,
      userId: user?.id,
      timestamp: new Date().toISOString()
    };

    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[method](`[${level.toUpperCase()}] ${message}`, { context, metadata });
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      await logToDatabase(entry);
    }
  }, [logToDatabase]);

  return {
    info: (message: string, context?: string, metadata?: Record<string, any>) => 
      log('info', message, context, metadata),
    warn: (message: string, context?: string, metadata?: Record<string, any>) => 
      log('warn', message, context, metadata),
    error: (message: string, context?: string, metadata?: Record<string, any>) => 
      log('error', message, context, metadata),
    debug: (message: string, context?: string, metadata?: Record<string, any>) => 
      log('debug', message, context, metadata),
  };
}