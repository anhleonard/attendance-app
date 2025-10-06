/**
 * Utility functions for secure logging
 */

export interface LoggableBody {
  [key: string]: any;
}

/**
 * Fields that should be masked for security reasons
 */
const SENSITIVE_FIELDS = [
  'password',
  'oldPassword',
  'newPassword',
  'confirmPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'key',
  'authorization',
  'auth',
  'authorization',
  'bearer',
  'jwt',
  'session',
  'cookie',
  'credentials',
  'private',
  'sensitive',
  'confidential',
  'secretKey',
  'privateKey',
  'publicKey',
  'signature',
  'hash',
  'salt',
  'iv',
  'nonce',
];

/**
 * Mask sensitive information in request body
 */
export function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  const maskedData = { ...data };
  
  for (const key in maskedData) {
    if (SENSITIVE_FIELDS.some(field => 
      key.toLowerCase().includes(field.toLowerCase())
    )) {
      maskedData[key] = '**********';
    } else if (typeof maskedData[key] === 'object' && maskedData[key] !== null) {
      maskedData[key] = maskSensitiveData(maskedData[key]);
    }
  }

  return maskedData;
}

/**
 * Create a clean log object without sensitive information
 */
export function createSecureLogObject(params: {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  body?: any;
  statusCode?: number;
  responseTime?: number;
  responseBody?: any;
  error?: any;
}) {
  const {
    timestamp,
    requestId,
    method,
    url,
    body,
    statusCode,
    responseTime,
    responseBody,
    error
  } = params;

  const logObject: any = {
    timestamp,
    id: requestId,
    request: {
      method,
      url,
      // Removed ip and userAgent for security
      body: body && Object.keys(body).length > 0 ? maskSensitiveData(body) : undefined,
    },
  };

  if (error) {
    logObject.response = {
      body: {
        errCode: error.code || error.status || 'INTERNAL_ERROR',
        message: error.message || 'An error occurred',
        stacktrace: error.stack || '',
      },
    };
  } else {
    logObject.response = {
      statusCode,
      responseTime,
      body: responseBody,
    };
  }

  return logObject;
} 