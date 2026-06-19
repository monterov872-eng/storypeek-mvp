export type ApiErrorReason =
  | 'instagram_block'
  | 'timeout'
  | 'network'
  | 'upstream'
  | 'rate_limit'
  | 'validation';

export type ApiErrorCode =
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_PRIVATE'
  | 'NO_STORIES'
  | 'UNLOCK_REQUIRED'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  reason?: ApiErrorReason;
}

export function getErrorCopy(error: ApiErrorBody): { title: string; message: string } {
  if (error.code === 'RATE_LIMITED') {
    return {
      title: 'Slow down',
      message: error.message || 'Too many searches. Please wait before trying again.',
    };
  }

  if (error.code === 'ACCOUNT_NOT_FOUND') {
    return {
      title: 'Account not found',
      message: 'Check the username. Only public accounts are supported.',
    };
  }

  if (error.code === 'ACCOUNT_PRIVATE') {
    return {
      title: 'Private account',
      message: 'This account is private. Silent View only supports public profiles.',
    };
  }

  if (error.code === 'NO_STORIES') {
    return {
      title: 'No stories',
      message: 'This profile has no public stories right now.',
    };
  }

  if (
    error.reason === 'instagram_block' ||
    error.message?.includes('Instagram temporarily blocked') ||
    error.message?.includes('Instagram blocked') ||
    error.message?.includes('Instagram may be limiting')
  ) {
    return {
      title: 'Instagram blocked',
      message: 'Instagram temporarily blocked requests. Try again later.',
    };
  }

  if (error.reason === 'timeout') {
    return {
      title: 'Request timed out',
      message: 'The server took too long to respond. Check your connection and try again.',
    };
  }

  if (error.reason === 'network') {
    return {
      title: 'Connection problem',
      message: 'Could not reach the server. Make sure the API is running and your network is OK.',
    };
  }

  if (
    error.code === 'SERVICE_UNAVAILABLE' &&
    error.message.includes('INSTAGRAM_SESSION_ID')
  ) {
    return {
      title: 'Stories need server setup',
      message:
        'Public stories require a one-time server cookie (INSTAGRAM_SESSION_ID in backend/.env). The app does not use your login.',
    };
  }

  if (error.code === 'SERVICE_UNAVAILABLE') {
    return {
      title: 'Temporarily unavailable',
      message: error.message || 'Something went wrong. Please try again shortly.',
    };
  }

  return {
    title: 'Something went wrong',
    message: error.message || 'Please try again.',
  };
}
