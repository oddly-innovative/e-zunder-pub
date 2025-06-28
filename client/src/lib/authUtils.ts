export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message) || error.message.includes('Unauthorized');
}

export function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('accessToken');
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
