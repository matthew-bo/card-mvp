export const ADMIN_EMAILS = [
    'matthew@thebofamily.com'
  ];
  
  export function isAdmin(email: string | null): boolean {
    return email ? ADMIN_EMAILS.includes(email) : false;
  }