# Lion Git Hooks

[![npm version](https://img.shields.io/npm/v/lion-git-hooks)](https://npmjs.com/package/lion-git-hooks)

This is a fork of [simple-git-hooks by toplenboren](https://github.com/toplenboren/simple-git-hooks) that adds some extra features for my personal use case.

## Usage

Install the package from npm:

```shell
npm install --save-dev lion-git-hooks
```

Then, add the following in your package.json

```jsonc
{
  // ...
  "scripts": {
    "prepare": "lion-git-hooks"
    // ...
  }
}
```

Then, create the following folder in your project root:

```
# Navigate to the root of your project
cd my-project

# Create a `scripts/hooks` folder in your project root (`lion-git-hooks` also reads from `scripts/src/hooks` as well in case you use a `src` folder in your `scripts` folder)
mkdir -p scripts/hooks

# Create files for the git hooks you want to run
echo 'console.log("commit-msg")' > scripts/hooks/commit-msg.ts
echo 'console.log("pre-commit")' > scripts/pre-commit.ts
echo 'console.log("pre-push")' > scripts/pre-push.ts
```

Then, modify the `scripts/hooks/*.ts` files to contain the code you want to run for the respective git hook.


