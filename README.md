# probot-auto-merge

[![Travis CI](https://travis-ci.org/bobvanderlinden/probot-auto-merge.svg?branch=master)](https://travis-ci.org/bobvanderlinden/probot-auto-merge)

A GitHub App built with [Probot](https://github.com/probot/probot) that automatically merges PRs

## Usage

1. [Configure the GitHub App](https://github.com/apps/probot-auto-merge)
2. Optionally use a custom configuration as shown below.

## Configuration

Create a file called `.github/auto-merge.yml` with the following content:

```yaml
# Configuration for probot-auto-merge - https://github.com/bobvanderlinden/probot-auto-merge

# The minimum number of reviews that approve the pull request before doing an automatic merge.
minApprovals: 1

# The maximum number of reviews that request changes to the pull request.
# Setting this number higher than 0 will allow automatic merging while changes are still requested.
maxRequestedChanges: 0

# Whether an out-of-date pull request is automatically updated.
# It does so by merging its base on top of the head of the pull request.
# This is the equivalent of clicking the 'Update branch' button.
# This is useful for repositories where protected branches are used and the option 'Require branches to be up to date before merging' is enabled.
# Note: this only works when the branch of the pull request resides in the same repository as the pull request itself.
updateBranch: true

# Whether the pull request branch is automatically deleted.
# This is the equivalent of clicking the 'Delete branch' button shown on merged pull requests.
# Note: this only works when the branch of the pull request resides in the same repository as the pull request itself.
deleteBranchAfterMerge: true

# In what way a pull request needs to be merged. This can be:
# * merge: creates a merge commit, combining the commits from the pull request on top of the base of the pull request (default)
# * rebase: places the commits from the pull request individually on top of the base of the pull request
# * squash: combines all changes from the pull request into a single commit and places the commit on top of the base of the pull request
# For more information see https://help.github.com/articles/about-pull-request-merges/
mergeMethod: merge

# Blocking labels are the labels that can be attached to a pull request to make sure the pull request is not being automatically merged.
blockingLabels:
- blocked

# Whenever required labels are configured, pull requests will only be automatically merged whenever all of these labels are attached to a pull request.
requiredLabels:
- merge
```

## Development

### Setup

```sh
# Install dependencies
npm install

# Run typescript
npm run build
```

### Testing

```sh
npm run test
```

or during development:

```sh
npm run test:watch
```

### Running

See https://probot.github.io/docs/development/#configuring-a-github-app

```sh
npm run build && npm run dev
```

## Contributing

If you have suggestions for how probot-auto-merge could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2018 Bob van der Linden <bobvanderlinden@gmail.com> (https://github.com/bobvanderlinden/probot-auto-merge)
