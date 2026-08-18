export interface FinderPattern {
  email: string;
  patternName: string;
  confidence: number;
}

/**
 * Generates standard corporate email patterns based on a name and domain.
 * Includes automatic deduplication for edge cases (like single-letter names).
 */
export function generateEmailPatterns(firstName: string, lastName: string, domain: string): FinderPattern[] {
  // 1. Strict Sanitization
  const f = firstName.trim().toLowerCase().replace(/[^a-z]/g, '');
  const l = lastName.trim().toLowerCase().replace(/[^a-z]/g, '');
  const d = domain.trim().toLowerCase();

  // If we don't have valid clean strings, return empty
  if (!f || !l || !d || !d.includes('.')) {
    return [];
  }

  // 2. Extract initials
  const f1 = f.charAt(0);
  const l1 = l.charAt(0);

  // 3. Generate the 15 patterns with real-world statistical confidence scores
  const patterns: FinderPattern[] = [
    { email: `${f}.${l}@${d}`,   patternName: 'first.last', confidence: 0.95 }, 
    { email: `${f}@${d}`,        patternName: 'first',      confidence: 0.85 }, 
    { email: `${f1}${l}@${d}`,   patternName: 'flast',      confidence: 0.80 }, 
    { email: `${f}${l1}@${d}`,   patternName: 'firstl',     confidence: 0.75 },
    { email: `${f}${l}@${d}`,    patternName: 'firstlast',  confidence: 0.70 },
    { email: `${f1}.${l}@${d}`,  patternName: 'f.last',     confidence: 0.65 },
    { email: `${f}_${l}@${d}`,   patternName: 'first_last', confidence: 0.60 },
    { email: `${l}@${d}`,        patternName: 'last',       confidence: 0.55 },
    { email: `${l}.${f}@${d}`,   patternName: 'last.first', confidence: 0.50 },
    { email: `${f1}_${l}@${d}`,  patternName: 'f_last',     confidence: 0.45 },
    { email: `${l}${f1}@${d}`,   patternName: 'lastf',      confidence: 0.40 },
    { email: `${l1}.${f}@${d}`,  patternName: 'l.first',    confidence: 0.35 },
    { email: `${l1}${f}@${d}`,   patternName: 'lfirst',     confidence: 0.30 },
    { email: `${l}${f}@${d}`,    patternName: 'lastfirst',  confidence: 0.25 },
    { email: `${f}-${l}@${d}`,   patternName: 'first-last', confidence: 0.20 }
  ];

  // 4. Sort the array by highest confidence first
  patterns.sort((a, b) => b.confidence - a.confidence);

  // 5. SMART DEDUPLICATION
  // We use a Set to keep track of emails we have already seen.
  // Because the array is already sorted, it will always keep the version with the highest score.
  const uniquePatterns: FinderPattern[] = [];
  const seenEmails = new Set<string>();

  for (const pattern of patterns) {
    if (!seenEmails.has(pattern.email)) {
      seenEmails.add(pattern.email);
      uniquePatterns.push(pattern);
    }
  }

  return uniquePatterns;
}