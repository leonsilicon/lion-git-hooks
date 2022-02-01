import fs from 'node:fs';
import path from 'node:path';
import { globbySync } from 'globby';
import { getConfig } from './config.js';
import { VALID_GIT_HOOKS, getGitProjectRoot } from './git.js';
import { getPackageJson } from './project.js';
import type { HookOptions } from '~/types/config.js';

/**
 * Checks the 'lion-git-hooks' in dependencies of the project
 * @throws TypeError if packageJsonData not an object
 */
export function checkSimpleGitHooksInDependencies(
	projectRootPath: string
): boolean {
	if (typeof projectRootPath !== 'string') {
		throw new TypeError('Package json path is not a string!');
	}

	const { packageJsonContent } = getPackageJson(projectRootPath);

	// If lion-git-hooks in dependencies -> note user that he should remove move it to devDeps!
	if (
		'dependencies' in packageJsonContent &&
		'lion-git-hooks' in packageJsonContent.dependencies!
	) {
		console.warn(
			'[WARN] You should move lion-git-hooks to the devDependencies!'
		);
		return true; // We only check that we are in the correct package, e.g not in a dependency of a dependency
	}

	if (!('devDependencies' in packageJsonContent)) {
		return false;
	}

	return 'lion-git-hooks' in packageJsonContent.devDependencies!;
}

/**
 * Parses the config and sets git hooks
 */
export async function setHooksFromConfig() {
	const config = await getConfig();

	if (!config) {
		throw new Error(
			'[ERROR] Config was not found! Please add `.lion-git-hooks.js` or `lion-git-hooks.js` or `.lion-git-hooks.json` or `lion-git-hooks.json` or `lion-git-hooks` entry in package.json.\r\nCheck README for details'
		);
	}

	const preserveUnused = Array.isArray(config.preserveUnused)
		? config.preserveUnused
		: config.preserveUnused
		? VALID_GIT_HOOKS
		: [];

	for (const hook of VALID_GIT_HOOKS) {
		// eslint-disable-next-line no-await-in-loop
		const hookOptions = await getHookOptions(hook);
		if (hookOptions !== undefined) {
			setHook(hook, hookOptions);
		} else if (!preserveUnused.includes(hook)) {
			removeHook(hook);
		}
	}
}

export async function getHookOptions(hook: string): Promise<HookOptions> {
	const config = await getConfig();
	const rootPath = getGitProjectRoot();

	const defaultHookOptions = {
		noCi: true,
		ciOnly: false,
	};

	const providedHookOptions = config.hooks?.[hook];

	if (
		providedHookOptions?.file !== undefined &&
		providedHookOptions?.command !== undefined
	) {
		throw new Error(
			'Only one of `file` or `command` can be provided in the hook options.'
		);
	}

	let hookCommand: string;
	if (providedHookOptions?.command !== undefined) {
		hookCommand = providedHookOptions.command;
		// eslint-disable-next-line no-negated-condition
	} else if (providedHookOptions?.file !== undefined) {
		hookCommand = `pnpm exec node-ts ${providedHookOptions.file}`;
	} else {
		const matches = globbySync([
			path.join(rootPath, `./scripts/${hook}.*`),
			path.join(rootPath, `./scripts/src/${hook}.*`),
		]);
		if (matches.length === 0) {
			throw new Error(`file for hook ${hook} not found.`);
		}

		hookCommand = `pnpm exec node-ts ${matches[0]!}`;
	}

	return {
		...defaultHookOptions,
		...providedHookOptions,
		command: hookCommand,
	};
}

/**
 * Creates or replaces an existing executable script in .git/hooks/<hook> with provided command
 * @param hook
 * @param command
 * @param projectRoot
 * @private
 */
function setHook(hook: string, hookOptions: HookOptions) {
	const gitRoot = getGitProjectRoot()!;

	const hookCommand = '#!/bin/sh\n' + hookOptions.command;
	const hookDirectory = gitRoot + '/hooks/';
	const hookPath = path.normalize(hookDirectory + hook);

	const normalizedHookDirectory = path.normalize(hookDirectory);
	if (!fs.existsSync(normalizedHookDirectory)) {
		fs.mkdirSync(normalizedHookDirectory);
	}

	fs.writeFileSync(hookPath, hookCommand);
	fs.chmodSync(hookPath, 0o0755);

	console.info(
		`[INFO] Successfully set the ${hook} with command: ${hookCommand}`
	);
}

/**
 * Deletes all git hooks
 * @param projectRoot
 */
export function removeHooks() {
	for (const configEntry of VALID_GIT_HOOKS) {
		removeHook(configEntry);
	}
}

/**
 * Removes the pre-commit hook from .git/hooks
 * @param hook
 * @param projectRoot
 * @private
 */
function removeHook(hook: string) {
	const gitRoot = getGitProjectRoot();
	const hookPath = path.normalize(gitRoot + '/hooks/' + hook);

	if (fs.existsSync(hookPath)) {
		fs.unlinkSync(hookPath);
	}
}
