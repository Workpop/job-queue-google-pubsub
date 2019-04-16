export default function log(category, level, ...rest          ) {
  const now = new Date();
  console.log(`${now.toISOString()} [${category}][${level}]`, ...rest); // eslint-disable-line no-console
}
