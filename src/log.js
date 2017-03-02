// @flow
export default function log(category: string, level: string, ...rest: Array<*>) {
  const now = new Date();
  console.log(`${now.toISOString()} [${category}][${level}] ${rest.join(' ')}`); // eslint-disable-line no-console
}
