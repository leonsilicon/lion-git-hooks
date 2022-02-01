# Lion Git Hooks

This is a fork of [simple-git-hooks by toplenboren](https://github.com/toplenboren/simple-git-hooks) that adds some extra features for my personal use case.

## TODO

Make lion-git-hooks automatically check `scripts/hooks` and `scripts/src/hooks` instead of having to specify the entire command in the package.json.

Add a "lion-git-hooks" key in the package.json that specifies options for hooks (e.g. `{ "prepush": { "no-ci": true } }`) and then have it take command-line arguments that set global options for the hooks (e.g. `lion-git-hooks --no-ci`).
