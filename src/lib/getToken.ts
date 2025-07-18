export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('token');
    } catch (err) {
      console.error('Token read error:', err);
    }
  }
  return null;
}