/**
 * Returns all items whose key includes the given substring (case-insensitive).
 * @param {Array} arr - Array of objects (does not need to be sorted).
 * @param {string} substring - The substring to search for.
 * @param {Function} keySelector - Function to get the string key from an item.
 * @returns {Array} Array of all matching items.
 */
export function binarySearchAllSubstring(arr, substring, keySelector = x => x) {
  if (!substring) return [];
  const lowerSub = substring.toLowerCase();

  return arr
    ?.filter(item => keySelector(item)?.toLowerCase().includes(lowerSub))
    ?.sort((a, b) => {
      const keyA = keySelector(a)?.toLowerCase() || '';
      const keyB = keySelector(b)?.toLowerCase() || '';

      const indexA = keyA.indexOf(lowerSub);
      const indexB = keyB.indexOf(lowerSub);

      // ✅ Priority 1: items starting with the substring
      const startsWithA = keyA.startsWith(lowerSub);
      const startsWithB = keyB.startsWith(lowerSub);
      if (startsWithA && !startsWithB) return -1;
      if (startsWithB && !startsWithA) return 1;

      // ✅ Priority 2: earlier match position
      if (indexA !== indexB) return indexA - indexB;

      // ✅ Priority 3: alphabetical fallback
      return keyA.localeCompare(keyB);
    });
}
