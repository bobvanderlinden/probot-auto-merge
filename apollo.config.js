module.exports = {
  client: {
    name: 'githubclient',
    service: {
      name: 'github',
      localSchemaFile: 'schema.json'
    },
    includes: ['*.graphql']
  }
}
