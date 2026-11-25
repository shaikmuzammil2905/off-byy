export function haversineKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
    Number.isNaN(Number(lat1)) || Number.isNaN(Number(lon1)) ||
    Number.isNaN(Number(lat2)) || Number.isNaN(Number(lon2))
  ) {
    return 0;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLon = toRad(Number(lon2) - Number(lon1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function isShopOpenNow(workingHoursJson, isOpenOverride) {
  if (isOpenOverride === 1) return true;
  if (isOpenOverride === 0) return false;
  try {
    const hours = typeof workingHoursJson === 'string' ? JSON.parse(workingHoursJson) : workingHoursJson;
    if (!hours || !hours.open || !hours.close) return true;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = hours.open.split(':').map(Number);
    const [ch, cm] = hours.close.split(':').map(Number);
    const openMins = oh * 60 + (om || 0);
    const closeMins = ch * 60 + (cm || 0);
    if (closeMins < openMins) {
      return currentMins >= openMins || currentMins <= closeMins;
    }
    return currentMins >= openMins && currentMins <= closeMins;
  } catch {
    return true;
  }
}

export function formatWorkingHours(workingHoursJson) {
  try {
    const hours = typeof workingHoursJson === 'string' ? JSON.parse(workingHoursJson) : workingHoursJson;
    if (!hours || !hours.open || !hours.close) return '9:00 AM – 9:00 PM';
    const fmt = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${String(m || 0).padStart(2, '0')} ${ampm}`;
    };
    return `${fmt(hours.open)} – ${fmt(hours.close)}`;
  } catch {
    return '9:00 AM – 9:00 PM';
  }
}
