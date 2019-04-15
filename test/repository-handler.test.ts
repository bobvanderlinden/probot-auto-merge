import { getMutations } from '../src/repository-handler'
import { validateQuery } from '../src/query-validator';
const queryResultRaw = require('../query-result.json')

describe('repositoryHandler', () => {
  it('a', () => {
    const queryResult = validateQuery(queryResultRaw.data)
    const mutations = getMutations(queryResult)
    console.log(mutations)
  })
})
