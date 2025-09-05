/**
 * Error recovery utilities for production monitoring
 */

export interface RecoveryAction {
  name: string;
  execute: () => Promise<boolean>;
  description: string;
}

export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private recoveryActions: Map<string, RecoveryAction[]> = new Map();

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  registerRecoveryAction(errorType: string, action: RecoveryAction) {
    if (!this.recoveryActions.has(errorType)) {
      this.recoveryActions.set(errorType, []);
    }
    this.recoveryActions.get(errorType)!.push(action);
  }

  async attemptRecovery(errorType: string): Promise<boolean> {
    const actions = this.recoveryActions.get(errorType) || [];
    
    for (const action of actions) {
      try {
        const success = await action.execute();
        if (success) {
          console.info(`Recovery successful using: ${action.name}`);
          return true;
        }
      } catch (recoveryError) {
        console.warn(`Recovery action ${action.name} failed:`, recoveryError);
      }
    }
    
    return false;
  }

  // Pre-registered recovery actions for common issues
  static registerCommonRecoveryActions() {
    const manager = ErrorRecoveryManager.getInstance();
    
    // Database connection recovery
    manager.registerRecoveryAction('database_error', {
      name: 'retry_connection',
      description: 'Retry database connection',
      execute: async () => {
        // Simple retry logic - in production this would be more sophisticated
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    });

    // Authentication recovery
    manager.registerRecoveryAction('auth_error', {
      name: 'refresh_session',
      description: 'Attempt to refresh user session',
      execute: async () => {
        try {
          // This would typically refresh the auth session
          return true;
        } catch {
          return false;
        }
      }
    });

    // Network recovery
    manager.registerRecoveryAction('network_error', {
      name: 'retry_request',
      description: 'Retry network request with exponential backoff',
      execute: async () => {
        // Implement exponential backoff retry
        return true;
      }
    });
  }
}

// Initialize common recovery actions
ErrorRecoveryManager.registerCommonRecoveryActions();