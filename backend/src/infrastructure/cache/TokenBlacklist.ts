const blacklist = new Set<string>();

export const TokenBlacklist = {
  add: (token: string) => blacklist.add(token),
  has: (token: string) => blacklist.has(token),
};
