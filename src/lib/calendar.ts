// Utilities to build calendar events (ICS) and links
// All times should be passed as Date objects in UTC or local; we will export as UTC (Z)

export interface CalendarEvent {
  title: string;
  description?: string;
  start: Date; // when the booking begins
  end: Date;   // when the booking ends
  location?: string;
  url?: string;
  organizerName?: string;
  organizerEmail?: string;
  attendeeEmails?: string[];
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const toICSDateUTC = (d: Date) => {
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
};

export const buildICS = (evt: CalendarEvent) => {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CoopMarket//Service Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID?.() || `${Date.now()}@coopmarket`}`,
    `DTSTAMP:${toICSDateUTC(new Date())}`,
    `DTSTART:${toICSDateUTC(evt.start)}`,
    `DTEND:${toICSDateUTC(evt.end)}`,
    `SUMMARY:${escapeICSText(evt.title)}`,
  ];
  if (evt.description) lines.push(`DESCRIPTION:${escapeICSText(evt.description)}`);
  if (evt.location) lines.push(`LOCATION:${escapeICSText(evt.location)}`);
  if (evt.url) lines.push(`URL:${escapeICSText(evt.url)}`);
  if (evt.organizerEmail) {
    const cn = evt.organizerName ? `;CN=${escapeICSText(evt.organizerName)}` : '';
    lines.push(`ORGANIZER${cn}:mailto:${evt.organizerEmail}`);
  }
  (evt.attendeeEmails || []).forEach((email) => {
    lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${email}`);
  });
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
};

const escapeICSText = (s: string) => s
  .replace(/\\/g, "\\\\")
  .replace(/\n/g, "\\n")
  .replace(/,/g, "\\,")
  .replace(/;/g, "\\;");

export const downloadICS = (filename: string, ics: string) => {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const googleCalendarUrl = (evt: CalendarEvent) => {
  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: evt.title,
    details: evt.description || '',
    location: evt.location || '',
    dates: `${toICSDateUTC(evt.start)}/${toICSDateUTC(evt.end)}`,
  });
  if (evt.url) params.set('sprop', evt.url);
  return `${base}&${params.toString()}`;
};
