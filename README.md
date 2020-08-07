# probot-auto-merge

[![Travis CI](https://travis-ci.org/bobvanderlinden/probot-auto-merge.svg?branch=master)](https://travis-ci.org/bobvanderlinden/probot-auto-merge)
[![Coverage](https://img.shields.io/coveralls/github/bobvanderlinden/probot-auto-merge.svg)](https://coveralls.io/github/bobvanderlinden/probot-auto-merge)

A GitHub App built with [Probot](https://github.com/probot/probot) that automatically merges PRs

> ![Probot Auto Merge in action](https://user-images.githubusercontent.com/6375609/45245043-d9c5ff00-b2fa-11e8-8745-2588323edda8.png)

## Usage

1. [Configure the GitHub App](https://github.com/apps/probot-auto-merge)
2. Create `.github/auto-merge.yml` in your repository.
3. Customize configuration to your needs. See below.

## Configuration

Configuration of probot-auto-merge is done through `.github/auto-merge.yml` in
your repository. An example of this file can be found [here](auto-merge.example.yml).
You can also see the configuration for this repository [here](.github/auto-merge.yml).

The configuration has values that serve as conditions on whether or not a pull request
should be automatically merged and also configuration about the merge itself. Values
that serve as conditions are annotated as such below.

All conditions must be met before a PR will be automatically merged. You can get more
flexibility by defining multiple rules. Rules can have multiple conditions and if any
of the conditions inside a rule are met, the PR is also merged. See [rules](#Rules).

If the target branch is a protected branch, you must add `probot-auto-merge` bot to
the list of `People, teams or apps with push access` in your branch protection rules.

Note that the default configuration options are to do nothing. This is to prevent
impicit and possibly unintended behavior.

The configuration fields are as follows:

### `minApprovals` (required, condition)

The minimum number of reviews from each association that approve the pull request before
doing an automatic merge. For more information about associations see:
https://developer.github.com/v4/enum/commentauthorassociation/

Possible associations: `OWNER`, `MEMBER`, `COLLABORATOR`, `CONTRIBUTOR`, `FIRST_TIMER`, `FIRST_TIME_CONTRIBUTOR`, `NONE`

In the example below when a pull request gets 2 approvals from owners, members or collaborators,
the automatic merge will continue.

```yaml
minApprovals:
  COLLABORATOR: 2
```

In the example below when a pull request gets 1 approval from an owner OR 2 approvals from members, the automatic merge will continue.

```yaml
minApprovals:
  OWNER: 1
  MEMBER: 2
```

### `maxRequestedChanges` (condition, default: none)

Similar to `minApprovals`, maxRequestedChanges determines the maximum number of
requested changes before a pull request will be blocked from being automatically
merged.

It yet again allows you to configure this per association.

Note that `maxRequestedChanges` takes presedence over `minApprovals`.

In the example below, automatic merges will be blocked when one of the owners, members
or collaborators has requested changes.

```yaml
maxRequestedChanges:
  COLLABORATOR: 0
```

In the example below, automatic merges will be blocked when the owner has
requested changes or two members, collaborators or other users have requested
changes.

```yaml
maxRequestedChanges:
  OWNER: 0
  NONE: 1
```

The default for this value is:

```yaml
maxRequestedChanges:
  NONE: 0
```

### `blockingLabels` (condition, default: none)

Blocking labels are the labels that can be attached to a pull request to make
sure the pull request is not being merged automatically.

In the example below, pull requests that have the `blocked` label will not be
merged automatically.

```yaml
blockingLabels:
- blocked
```

Note: remove the whole section when you're not using blocking labels.

### `requiredLabels` (condition, default: none)

Whenever required labels are configured, pull requests will only be automatically
merged whenever all of these labels are attached to a pull request.

In the example below, pull requests need to have the label `merge` before they
will be automatically merged.

```yaml
requiredLabels:
- merge
```

Note: remove the whole section when you're not using required labels.

### `blockingTitleRegex` (condition, default: none)

Whenever a blocking title regular expression is configured, pull requests that have a title
matching the configured expression will not be automatically merged.

This is useful whenever pull requests with `WIP` in their title need to be skipped.

In the example below, pull requests with the word `wip` in the title will not be
automatically merged. This also includes `[wip]`, `WIP` or `[WIP]`, but not `swiping`:

```yaml
blockingTitleRegex: '\bWIP\b'
```

### `requiredTitleRegex` (condition, default: none)

Whenever a required title regular expression is configured, only pull requests that have a title
matching the configured expression will automatically be merged.

This is useful for forks, that can only create pull request text, no labels.

In the example below, pull requests with the title containing `MERGE` will be
automatically merged. This also includes This also includes `[merge]`, `MERGE` or `[MERGE]`, but not `submerge`:

```yaml
requiredTitleRegex: '\bMERGE\b'
```

### `blockingBodyRegex` (condition, default: none)

Whenever a blocking body regular expression is configured, pull requests that have a body
matching the configured expression will not be automatically merged.

This is useful whenever pull requests with a certain string in their body need to be skipped.

In the example below, pull requests with the body containing `do-not-merge` will not be
automatically merged. This also includes `labels: do-not-merge`, `LABELS: DO-NOT-MERGE` or `some more text, but do-not-merge`,
but not `do-not-merge-just-kidding`:

```yaml
blockingBodyRegex: '(^|\\s)do-not-merge($|\\s)'
```

### `requiredBodyRegex` (condition, default: none)

Whenever a required body regular expression is configured, only pull requests that have a body
matching the configured expression will automatically be merged.

This is useful for forks, that can only create pull request text, no labels.

In the example below, pull requests with the body containing `ok-to-merge` will be
automatically merged. This also includes `labels: ok-to-merge`, `LABELS: OK-TO-MERGE` or `some more text, but ok-to-merge`, but not `not-ok-to-merge`:

```yaml
requiredBodyRegex: '(^|\\s)ok-to-merge($|\\s)'
```

### `reportStatus` (default: `false`)

The status of the auto-merge process will be shown in each PR as a [check](https://help.github.com/articles/about-status-checks/). This can be especially useful to find out why a PR is not being merged automatically.

To enable status reporting, add the following to your configuration:

```yaml
reportStatus: true
```

### `updateBranch` (default: `false`)

Whether an out-of-date pull request is automatically updated.
It does so by merging its base on top of the head of the pull request.
This is similar to the behavior of the 'Update branch' button.

`updateBranch` is useful for repositories where protected branches are used
and the option *Require branches to be up to date before merging* is enabled.

Note that this only works when the branch of the pull request resides in the same
repository as the pull request itself.

In the example below automatic updating of branches is enabled:

```yaml
updateBranch: true
```

### `deleteBranchAfterMerge` (default: `false`)

Whether the pull request branch is automatically deleted.
This is the equivalent of clicking the 'Delete branch' button shown on merged
pull requests.

Note that this only works when the branch of the pull request resides in the same
repository as the pull request itself.

In the example below automatic deletion of pull request branches is enabled:

```yaml
deleteBranchAfterMerge: true
```

### `mergeMethod` (default: `merge`)

In what way a pull request is merged. This can be:

* `merge`: creates a merge commit, combining the commits from the pull request on top of
  the base of the pull request (default)
* `rebase`: places the commits from the pull request individually on top of the base of the pull request
* `squash`: combines all changes from the pull request into a single commit and places the commit on top
  of the base of the pull request

For more information see https://help.github.com/articles/about-pull-request-merges/

```yaml
mergeMethod: merge
```

### `mergeCommitMessage` (default: none)

Optionally specify the merge commit message format. The following template tags
are supported:

* `{title}`: The pull request title at the moment it is merged
* `{body}`: The pull request body at the moment it is merged
* `{number}`: The pull request number
* `{branch}`: The name of the source branch
* `{commits}`: A list of merged commits

When this option is not set, the merge commit message is controlled by
GitHub and uses a combination of the title of the pull request when it was
opened (note that later changes to the title are ignored) and a list of
commits.

This settings is ignored when `mergeMethod` is set to `rebase`.

```yaml
mergeCommitMessage: |
  {title} (#{number})
  {body}
```

### `rules` (default: none)

Rules allow more flexiblity configuring conditions for automatically merging. Each rule is defined by
multiple conditions. All conditions inside a rule must be met before a rule triggers a merge. Any of the
defined rules can trigger a merge individually.

An example of a configuration with 2 rules that will trigger a merge upon 1 approval from an owner *or* a `merge` label:

```yaml
rules:
- minApprovals:
    OWNER: 1
- requiredLabels:
    - merge
```

This can be combined with conditions on global level, as the global conditions will take presedence. The following example will not trigger a merge when a PR has the `blocking` label, regardless what the rules say:

```yaml
blockingLabels:
- blocking
rules:
- minApprovals:
    OWNER: 1
- requiredLabels:
    - merge
```

Note: remove the whole rules section when you're not using any rules.

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

### Running on Docker

This will build and run the app on a container called `probot-auto-merge`:

```sh
npm run docker
```

To just build the container image:

```sh
npm run docker:build
```

To run the built image:

```sh
npm run docker:run
```

## Deployment

To deploy `probot-auto-merge` yourself, please follow [the guidelines defined by probot on deploying GitHub applications](https://probot.github.io/docs/deployment/).

The permissions and events needed for the app to function can be found below.

### Permissions

* Administration: Read-only
* Checks: Read & write
* Contents: Read & write
* Issues: Read & write
* Metadata: Read-only
* Pull requests: Read & write
* Commit statuses: Read-only
* Members: Read-only

### Events

* Check run
* Check suite
* Label
* Pull request
* Pull request review
* Pull request review comment
* Status

## Contributing

If you have suggestions for how probot-auto-merge could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2018 Bob van der Linden <bobvanderlinden@gmail.com> (https://github.com/bobvanderlinden/probot-auto-merge)
