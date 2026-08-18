export const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'temp-mail.org', 'guerrillamail.com', 
  '10minutemail.com', 'sharklasers.com', 'dispostable.com',
  'getnada.com', 'boun.cr', 'maildrop.cc'
];

export const isValidEmail = (email: string) => {
  const domain = email.split('@')[1];
  return !DISPOSABLE_DOMAINS.includes(domain?.toLowerCase());
};