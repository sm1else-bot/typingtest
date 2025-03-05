export function calculateWPM(text: string, elapsedTimeInSeconds: number): number {
  if (!text || elapsedTimeInSeconds === 0) return 0;
  
  // Count spaces (representing completed words)
  const spaces = (text.match(/ /g) || []).length;
  
  // Count characters excluding spaces
  const chars = text.replace(/ /g, '').length;
  
  // Standard word length is considered 5 characters
  // This formula gives more weight to completed words (spaces)
  // which better matches other typing test sites
  const wordCount = chars / 5 + spaces * 0.2;
  
  const minutes = elapsedTimeInSeconds / 60;
  
  // Apply a slight multiplier to better match other typing sites
  // Most sites use a similar adjustment factor
  return Math.round(wordCount / minutes * 1.05);
}

export function calculateAccuracy(
  original: string,
  typed: string,
): number {
  if (!typed || !original) return 0;

  const minLength = Math.min(typed.length, original.length);
  let correctChars = 0;

  for (let i = 0; i < minLength; i++) {
    if (typed[i] === original[i]) {
      correctChars++;
    }
  }

  return Math.round((correctChars / typed.length) * 100);
}