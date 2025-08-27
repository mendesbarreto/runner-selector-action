# Runner Selector Action

<p align="center">
<a href="https://github.com/mendesbarreto/runner-selector/actions"><img alt="CI Status" src="https://github.com/mendesbarreto/runner-selector/workflows/units-test/badge.svg"></a>
<a href="https://github.com/marketplace/actions/runner-selector"><img alt="Marketplace" src="https://img.shields.io/badge/Marketplace-Runner%20Selector-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=github"></a>
</p>

Don't let offline self-hosted runners break your workflow! This GitHub Action dynamically selects a runner for your jobs. It checks for the availability of your primary self-hosted runners and seamlessly falls back to a GitHub-hosted runner if they are offline.

This action uses the [GitHub API](https://docs.github.com/en/rest/actions/self-hosted-runners) to check the status of self-hosted runners that match specific labels. It then outputs the appropriate runner label to be used in the `runs-on` property of subsequent jobs.

## Inputs

| Input             | Description                                                                                | Required | Default |
| ----------------- | ------------------------------------------------------------------------------------------ | -------- | ------- |
| `primary-runner`  | Comma-separated list of labels for the primary runner. Ex: `self-hosted,linux,x64`         | `true`   | `N/A`   |
| `fallback-runner` | Label for the fallback runner if the primary is offline. Ex: `ubuntu-latest`               | `true`   | `N/A`   |
| `github-token`    | GitHub token for querying runner information. See permissions below.                       | `true`   | `N/A`   |
| `check-org-runners`| Set to `true` to check organization-level runners instead of repository-level runners.     | `false`  | `false` |

## Outputs

| Output       | Description                                                                    |
| ------------ | ------------------------------------------------------------------------------ |
| `use-runner` | A JSON-formatted string with the labels of the runner to use, ready for `fromJson`. |

## Example Workflow

The action is designed to run in a preliminary job that determines which runner is available. The output is then passed to the `matrix` or `runs-on` property of the main job(s).

```yaml
name: CI Pipeline

jobs:
  # 1. This job "selects" the runner
  determine-runner:
    runs-on: ubuntu-latest
    outputs:
      runner: ${{ steps.runner-selector.outputs.use-runner }}
    steps:
      - name: Select self-hosted runner with fallback
        id: runner-selector
        uses: mendesbarreto/runner-selector-action@v1 
        with:
          primary-runner: "self-hosted,linux"
          fallback-runner: "ubuntu-latest"
          github-token: ${{ secrets.GH_TOKEN_FOR_ACTIONS }}
          check-org-runners: false # Optional: set to true to check org-level runners

  build-and-test:
    needs: determine-runner
    runs-on: ${{ fromJson(needs.determine-runner.outputs.runner) }}
    steps:
      - name: Print selected runner
        run: echo "This job is running on ${{ needs.determine-runner.outputs.runner }}"
      
      - name: Checkout code
        uses: actions/checkout@v4

      # ... your build and test steps here
```

### Token Permissions

You will need to create a personal access token (PAT) or use a GitHub App token with the correct permissions and add it to your repository secrets.

The `github-token` requires the following permission:

* `actions:read` - to read runner information for the repository or organization.

## Credits

This action is based on the pattern described by @ianpurton in [this feature request thread](https://github.com/orgs/community/discussions/20019#discussioncomment-5414593).
