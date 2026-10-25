export function companySchema(schemas, profile) {
  const id = profile.url + '#organization';
  const nodes = schemas.flatMap(schema => schema['@graph'] || [schema]);
  const original = nodes.find(node => node['@id'] === id && [node['@type']].flat().includes('MovingCompany')) || nodes.find(node => node['@id'] === id) || {};
  const entity = {
    ...original, '@type': 'MovingCompany', '@id': id,
    name: profile.name, alternateName: [...new Set([profile.shortName, profile.alternateName, original.name, ...[original.alternateName || []].flat()])].filter(Boolean),
    url: profile.url, telephone: profile.telephone, email: profile.email,
    logo: profile.logo, image: profile.logo,
    contactPoint: { '@type': 'ContactPoint', telephone: profile.telephone, contactType: 'customer service', availableLanguage: ['ar'] },
  };
  let inserted = false;
  const results = [];
  for (const schema of schemas) {
    const graph = (schema['@graph'] || [schema]).flatMap(node => {
      if (node['@id'] !== id) return [node];
      if (inserted) return [];
      inserted = true;
      return [entity];
    });
    if (graph.length) results.push(schema['@graph'] ? { ...schema, '@graph': graph } : { '@context': 'https://schema.org', ...graph[0] });
  }
  if (!inserted) results.push({ '@context': 'https://schema.org', ...entity });
  return results;
}
