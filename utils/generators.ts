export function generateApiKey(length = 32) {
  const prefix = 'plg';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const keyLength = length - prefix.length;

  let randomPart = '';
  for (let i = 0; i < keyLength; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return prefix + randomPart;
}