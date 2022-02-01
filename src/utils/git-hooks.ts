import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getConfig } from './config.js';
import { VALID_GIT_HOOKS, getGitProjectRoot } from './git.js';
import { getPackageJson } from './project.js';

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
export async function setHooksFromConfig(
	projectRootPath: string = process.cwd()
) {
	const config = await getConfig(projectRootPath);

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
		if (Object.prototype.hasOwnProperty.call(config, hook)) {
			setHook(hook, config[hook]!, projectRootPath);
		} else if (!preserveUnused.includes(hook)) {
			removeHook(hook, projectRootPath);
		}
	}
}

/**
 * Creates or replaces an existing executable script in .git/hooks/<hook> with provided command
 * @param hook
 * @param command
 * @param projectRoot
 * @private
 */
function setHook(hook: string, command: string, projectRoot = process.cwd()) {
	const gitRoot = getGitProjectRoot(projectRoot)!;

	const hookCommand = '#!/bin/sh\n' + command;
	const hookDirectory = gitRoot + '/hooks/';
	const hookPath = path.normalize(hookDirectory + hook);

	const normalizedHookDirectory = path.normalize(hookDirectory);
	if (!fs.existsSync(normalizedHookDirectory)) {
		fs.mkdirSync(normalizedHookDirectory);
	}

	fs.writeFileSync(hookPath, hookCommand);
	fs.chmodSync(hookPath, 0o0755);

	console.info(`[INFO] Successfully set the ${hook} with command: ${command}`);
}

/**
 * Deletes all git hooks
 * @param projectRoot
 */
export function removeHooks(projectRoot: string = process.cwd()) {
	for (const configEntry of VALID_GIT_HOOKS) {
		removeHook(configEntry, projectRoot);
	}
}

/**
 * Removes the pre-commit hook from .git/hooks
 * @param hook
 * @param projectRoot
 * @private
 */
function removeHook(hook: string, projectRoot: string = process.cwd()) {
	const gitRoot = getGitProjectRoot(projectRoot)!;
	const hookPath = path.normalize(gitRoot + '/hooks/' + hook);

	if (fs.existsSync(hookPath)) {
		fs.unlinkSync(hookPath);
	}
}

const VALID_OPTIONS = new Set(['preserveUnused']);

/**
 * Validates the config, checks that every git hook or option is named correctly
 * @param config
 */
export function validateHooks(config: Record<string, string>): boolean {
	for (const hookOrOption in config) {
		if (
			!VALID_GIT_HOOKS.includes(hookOrOption) &&
			!VALID_OPTIONS.has(hookOrOption)
		) {
			return false;
		}
	}

	return true;
}
