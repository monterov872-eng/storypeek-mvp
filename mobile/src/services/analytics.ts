type AnalyticsEvent =
  | 'app_open'
  | 'search'
  | 'profile_load_success'
  | 'profile_load_failed'
  | 'story_unlock'
  | 'highlight_unlock'
  | 'ad_impression'
  | 'ad_completion'
  | 'error'
  | 'retention_day';

/** MVP stub — wire to Firebase / Amplitude in production */
export function track(event: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
  if (__DEV__) {
    console.log('[analytics]', event, params ?? {});
  }
}
