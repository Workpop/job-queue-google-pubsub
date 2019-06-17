/**
 * @param { Buffer | string } data
 * @param { { [x: string]: string; } } attributes
 */
export function getContent(data, attributes) {
  // check data is a buffer or a string
  const contents = data instanceof Buffer ? data.toString() : data;

  if (attributes
    && attributes['content-type'] === 'application/json') {
    return JSON.parse(contents);
  }
  if (contents.length > 0
    && (contents[0] === '{' || contents[0] === '[' || contents[0] === '"')) {
    // check is required for messages published by old publisher
    return JSON.parse(contents);
  }
  return contents;
}
