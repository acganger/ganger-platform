import { google } from 'googleapis';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface CalendarListOptions {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  orderBy?: 'startTime' | 'updated';
  singleEvents?: boolean;
  q?: string;
}

export class GoogleCalendarClient {
  private calendar;

  constructor(private auth: any) {
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  static createAuth(credentials: any, _scopes: string[]) {
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  }

  async listEvents(calendarId = 'primary', options: CalendarListOptions = {}) {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: options.timeMin || new Date().toISOString(),
        maxResults: options.maxResults || 10,
        singleEvents: options.singleEvents ?? true,
        orderBy: options.orderBy || 'startTime',
        q: options.q,
        timeMax: options.timeMax,
      });
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  async createEvent(calendarId = 'primary', event: CalendarEvent) {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(calendarId = 'primary', eventId: string, event: Partial<CalendarEvent>) {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(calendarId = 'primary', eventId: string) {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async getEvent(calendarId = 'primary', eventId: string) {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching calendar event:', error);
      throw error;
    }
  }

  async listCalendars() {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendars:', error);
      throw error;
    }
  }

  async findAvailableSlots(
    calendarId = 'primary',
    startDate: string,
    endDate: string,
    durationMinutes = 30,
    workingHours = { start: 9, end: 17 }
  ) {
    try {
      const events = await this.listEvents(calendarId, {
        timeMin: startDate,
        timeMax: endDate,
        orderBy: 'startTime',
      });

      const availableSlots = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(workingHours.start, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(workingHours.end, 0, 0, 0);

        // Find busy periods for this day
        const dayEvents = events
          .filter((event: any) => {
            if (!event.start?.dateTime) return false;
            const eventStart = new Date(event.start.dateTime);
            return eventStart.toDateString() === d.toDateString();
          })
          .sort((a: any, b: any) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());

        // Find available slots
        let currentTime = new Date(dayStart);
        for (const event of dayEvents) {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');

          // Check if there's a gap before this event
          if (currentTime.getTime() + durationMinutes * 60000 <= eventStart.getTime()) {
            while (currentTime.getTime() + durationMinutes * 60000 <= eventStart.getTime()) {
              availableSlots.push({
                start: new Date(currentTime).toISOString(),
                end: new Date(currentTime.getTime() + durationMinutes * 60000).toISOString(),
              });
              currentTime = new Date(currentTime.getTime() + durationMinutes * 60000);
            }
          }
          currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
        }

        // Check remaining time after last event
        while (currentTime.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
          availableSlots.push({
            start: new Date(currentTime).toISOString(),
            end: new Date(currentTime.getTime() + durationMinutes * 60000).toISOString(),
          });
          currentTime = new Date(currentTime.getTime() + durationMinutes * 60000);
        }
      }

      return availableSlots;
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw error;
    }
  }

  /**
   * Get authentication status
   */
  public getAuthStatus() {
    return {
      authenticated: !!this.auth,
      authType: this.auth?.constructor?.name || 'unknown',
      // TODO: Add actual token validation when implementing refresh
      tokenValid: !!this.auth
    };
  }
}