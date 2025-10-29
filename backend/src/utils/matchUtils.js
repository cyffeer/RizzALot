export function normalizeList(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr
    .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
    .filter(Boolean);
}

export function computeMutualInterests(me, other) {
  const mine = me?.profileQuestions || {};
  const theirs = other?.profileQuestions || {};

  const music = intersect(normalizeList(mine.musicGenres), normalizeList(theirs.musicGenres));
  const hobbies = intersect(normalizeList(mine.hobbies), normalizeList(theirs.hobbies));
  const passions = intersect(normalizeList(mine.passions), normalizeList(theirs.passions));

  const shared = [...music, ...hobbies, ...passions].slice(0, 6);
  const count = music.length + hobbies.length + passions.length;

  return { musicGenres: music, hobbies, passions, shared, count };
}

export function computeMatchReasons(me, other) {
  const mutual = computeMutualInterests(me, other);
  const reasons = [];
  if (mutual.musicGenres.length) reasons.push(`Shared music: ${mutual.musicGenres.slice(0, 3).join(', ')}`);
  if (mutual.hobbies.length) reasons.push(`Shared hobbies: ${mutual.hobbies.slice(0, 3).join(', ')}`);
  if (mutual.passions.length) reasons.push(`Shared passions: ${mutual.passions.slice(0, 3).join(', ')}`);
  return { reasons, mutual };
}

function intersect(a, b) {
  if (!a.length || !b.length) return [];
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}
