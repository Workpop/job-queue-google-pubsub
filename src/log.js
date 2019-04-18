/**
 * @param {string} category
 * @param {string} level
 * @param {any[]} rest
 */
// eslint-disable-next-line import/prefer-default-export
export function log(category, level, ...rest) {
  const now = new Date();
  console.log(`${now.toISOString()} [${category}][${level}]`, ...rest); // eslint-disable-line no-console
}
