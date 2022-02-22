import fs from 'node:fs';
import path from 'node:path';
import isCI from 'is-ci';
import { getHookConfig } from './config.js';
import { VALID_GIT_HOOKS, getProjectGitFolder } from './git.js';
import { getPackageJson } from './project.js';
import type { LionGitHooksConfig } from '~/types/config.js';
import { isHeroku } from '~/utils/heroku.js';

/**
 * Checks the 'lion-git-hooks' in dependencies of the project
 * @throws TypeError if packageJsonData not an object
 */
export function checkSimpleGitHooksInDependencies(
	config: LionGitHooksConfig
): boolean {
	const { packageJsonContent } = getPackageJson(config);

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
export function setHooksFromConfig(
	config: LionGitHooksConfig
): { hooksSet: true } | { hooksSet: false; reason: string } {
	if (config.noCi && (isCI || isHeroku())) {
		return {
			hooksSet: false,
			reason:
				'Skipped setting hooks because a CI environment was detected and --no-ci was set',
		};
	}

	if (config.ciOnly && !isCI) {
		return {
			hooksSet: false,
			reason:
				"Skipped setting hooks because a CI environment wasn't detected and --ci-only was set.",
		};
	}

	if (!config) {
		throw new Error(
			'[ERROR] Config was not found! Please add `.lion-git-hooks.js` or `lion-git-hooks.js` or `.lion-git-hooks.json` or `lion-git-hooks.json` or `lion-git-hooks` entry in package.json.\r\nCheck README for details'
		);
	}

	for (const hook of VALID_GIT_HOOKS) {
		updateHook(config, hook);
	}

	return {
		hooksSet: true,
	};
}

export function updateHook(config: LionGitHooksConfig, hook: string) {
	const preserveUnused = Array.isArray(config.preserveUnused)
		? config.preserveUnused
		: config.preserveUnused
		? VALID_GIT_HOOKS
		: [];

	const hookConfig = getHookConfig(config, hook);
	if (hookConfig !== undefined) {
		setHook(config, hook);
	} else if (!preserveUnused.includes(hook)) {
		removeHook(config, hook);
	}
}

/**
 * Creates or replaces an existing executable script in .git/hooks/<hook> with provided command
 * @param hook
 * @param command
 * @param projectRoot
 * @private
 */
function setHook(config: LionGitHooksConfig, hook: string) {
	const gitFolder = getProjectGitFolder(config)!;
	const hookOptions = getHookConfig(config, hook)!;

	const hookCommand = '#!/bin/sh\n' + hookOptions.command;
	const hookDirectory = gitFolder + '/hooks/';
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
export function removeHooks(config: LionGitHooksConfig) {
	for (const configEntry of VALID_GIT_HOOKS) {
		removeHook(config, configEntry);
	}
}

/**
 * Removes the pre-commit hook from .git/hooks
 * @param hook
 * @param projectRoot
 * @private
 */
function removeHook(config: LionGitHooksConfig, hook: string) {
	const gitRoot = getProjectGitFolder(config);
	const hookPath = path.normalize(gitRoot + '/hooks/' + hook);

	if (fs.existsSync(hookPath)) {
		fs.unlinkSync(hookPath);
	}
}
