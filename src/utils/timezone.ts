/**
 * Convert a local datetime-local input value to UTC ISO string
 *
 * The datetime-local input provides a value in the format "YYYY-MM-DDTHH:mm"
 * representing the user's local time. This function converts it to UTC ISO string
 * for storage in the database.
 *
 * @param localDatetimeValue - Value from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns UTC ISO string (YYYY-MM-DDTHH:mm:ss.sssZ)
 */
export const localDatetimeToUtcIso = (localDatetimeValue: string): string => {
  if (!localDatetimeValue) return "";

  // Parse the local datetime value (browser interprets it as local time)
  const localDate = new Date(localDatetimeValue);

  // Convert to UTC by getting the ISO string
  // The Date object stores time internally as UTC, so toISOString() gives us UTC
  return localDate.toISOString();
};

/**
 * Convert a UTC ISO string to datetime-local input format for display
 *
 * @param utcIsoString - UTC ISO string from database
 * @returns datetime-local value (YYYY-MM-DDTHH:mm)
 */
export const utcIsoToLocalDatetime = (utcIsoString: string): string => {
  if (!utcIsoString) return "";

  const utcDate = new Date(utcIsoString);
  // Adjust for timezone offset to get local time
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);

  // Format as datetime-local (YYYY-MM-DDTHH:mm)
  return localDate.toISOString().slice(0, 16);
};
