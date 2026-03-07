import { Injectable } from '@angular/core';

export interface SessionItemForValidation {
  title?: string;
  start_time?: string;
  end_time?: string;
  speaker?: string;
  description?: string;
  id?: number;
}

export const SESSION_VALIDATION_KEYS = {
  OVERLAP: 'dashboard.formSessionOverlapError',
  INVALID_TIMES: 'dashboard.formSessionInvalidTimes',
  TITLE_MIN: 'dashboard.formErrorTitleMin',
  START_REQUIRED: 'dashboard.formErrorStartRequired',
  OUTSIDE_EVENT_DATES: 'dashboard.formSessionOutsideEventDates',
  SPEAKER_REQUIRED: 'dashboard.formSessionSpeaker',
  TITLE_REQUIRED: 'dashboard.formErrorTitleRequired'
} as const;

@Injectable({
  providedIn: 'root'
})
export class SessionValidationService {

  getOverlapErrorKey(sessions: SessionItemForValidation[], index: number): string | null {
    const s = sessions[index];
    if (!s?.start_time || !s?.end_time) return null;
    const start = new Date(s.start_time).getTime();
    const end = new Date(s.end_time).getTime();
    if (end <= start) return SESSION_VALIDATION_KEYS.INVALID_TIMES;
    for (let i = 0; i < sessions.length; i++) {
      if (i === index) continue;
      const o = sessions[i];
      if (!o?.start_time || !o?.end_time) continue;
      const oStart = new Date(o.start_time).getTime();
      const oEnd = new Date(o.end_time).getTime();
      if (start < oEnd && end > oStart) return SESSION_VALIDATION_KEYS.OVERLAP;
    }
    return null;
  }

  getValidationErrorKey(
    sessions: SessionItemForValidation[],
    eventStart: Date,
    eventEnd: Date
  ): string | null {
    const eventStartMs = eventStart.getTime();
    const eventEndMs = eventEnd.getTime();

    for (let i = 0; i < sessions.length; i++) {
      if (this.getOverlapErrorKey(sessions, i)) return SESSION_VALIDATION_KEYS.OVERLAP;

      const s = sessions[i];
      const title = (s.title ?? '').trim();
      if (title.length < 3) return SESSION_VALIDATION_KEYS.TITLE_MIN;
      if (!s.start_time || !s.end_time) return SESSION_VALIDATION_KEYS.START_REQUIRED;

      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      if (end <= start) return SESSION_VALIDATION_KEYS.INVALID_TIMES;
      if (start.getTime() < eventStartMs || end.getTime() > eventEndMs) {
        return SESSION_VALIDATION_KEYS.OUTSIDE_EVENT_DATES;
      }
      if (!(s.speaker ?? '').trim()) {
        return SESSION_VALIDATION_KEYS.SPEAKER_REQUIRED;
      }
    }
    return null;
  }
}
