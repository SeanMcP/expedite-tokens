module.exports = (def) => {
  const content = def
    .get('props')
    .sortBy((prop) => prop.get('name'))
    .map((prop) => {
      let result = [];
      const key = camelCase(prop.get('name'));
      const value = JSON.stringify(prop.get('value'));
      result = result.push(`  ${key}: ${value};`);
      return result;
    })
    .flatten(1)
    .toArray()
    .join('\n');
  return [
    'declare interface Tokens {',
    content,
    '}',
    'declare let tokens: Tokens;',
    'export = tokens;',
  ].join('\n');
};