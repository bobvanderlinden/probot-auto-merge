import { GitHubAPI } from "probot/lib/github"
import { GraphQlQueryResponse } from "@octokit/graphql/dist-types/types"

export async function rawGraphQLQuery (github: GitHubAPI, query: string, variables: { [key in string]: any }, headers: { [key in string]: string }): Promise<GraphQlQueryResponse> {
  try {
    // Warning: The type signature of the graphql call is incorrect. It actually returns the data of the graphql response.
    // the errors are passed by throwing an exception.
    const data = await github.graphql(query, {
      ...variables,
      headers
    }) as any
    return {
      data
    }
  } catch (e) {
    if (e && e.name === 'GraphqlError') {
      const errors = e.errors
      const data = e.data
      return {
        data,
        errors
      }
    } else {
      throw e
    }
  }
}
