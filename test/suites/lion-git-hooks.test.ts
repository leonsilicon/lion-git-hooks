import fs from 'node:fs';
import path from 'node:path';
import { join } from 'desm';
import type { PackageJson } from 'type-fest';
import { test, expect } from 'vitest';
import { getConfig } from '~/utils/config.js';
import { getProjectRootDirectoryFromNodeModules } from '~/utils/project.js';
import {
	checkSimpleGitHooksInDependencies,
	setHooksFromConfig,
	removeHooks,
} from '~/utils/git-hooks.js';

const rootPath = join(import.meta.url, '../..');

function getTestConfig(projectPath: string) {
	const config = getConfig({
		projectPath,
	});
	return config;
}

const packageJson = JSON.parse(
	fs.readFileSync(path.join(rootPath, './package.json')).toString()
) as PackageJson;

const packageVersion = packageJson.version!;

// Get project root directory

test('getProjectRootDirectory returns correct dir in typical case:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules(
			'var/my-project/node_modules/lion-git-hooks'
		)
	).toBe('var/my-project');
});

test('getProjectRootDirectory returns correct dir when used with windows delimiters:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules(
			'user\\allProjects\\project\\node_modules\\lion-git-hooks'
		)
	).toBe('user/allProjects/project');
});

test('getProjectRootDirectory falls back to undefined when we are not in node_modules:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules('var/my-project/lion-git-hooks')
	).toBe(undefined);
});

test('getProjectRootDirectory return correct dir when installed using pnpm:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules(
			`var/my-project/node_modules/.pnpm/lion-git-hooks@${packageVersion}`
		)
	).toBe('var/my-project');
	expect(
		getProjectRootDirectoryFromNodeModules(
			`var/my-project/node_modules/.pnpm/lion-git-hooks@${packageVersion}/node_modules/lion-git-hooks`
		)
	).toBe('var/my-project');
});

// Check if lion-git-hooks is in devDependencies or dependencies in package json

const fixturesFolder = join(import.meta.url, '../fixtures');

const correctPackageJsonProjectPath = path.normalize(
	path.join(fixturesFolder, 'project_with_simple_pre_commit_in_deps')
);
const correctPackageJsonProjectPath2 = path.normalize(
	path.join(fixturesFolder, 'project_with_simple_pre_commit_in_dev_deps')
);
const incorrectPackageJsonProjectPath = path.normalize(
	path.join(fixturesFolder, 'project_without_simple_pre_commit')
);

test('returns true if simple pre commit really in devDeps', () => {
	const config = getTestConfig(correctPackageJsonProjectPath);
	expect(checkSimpleGitHooksInDependencies(config)).toBe(true);
});

test('returns true if simple pre commit really in deps', () => {
	const config = getTestConfig(correctPackageJsonProjectPath2);
	expect(checkSimpleGitHooksInDependencies(config)).toBe(true);
});

test('returns false if simple pre commit isn`t in deps', () => {
	const config = getTestConfig(incorrectPackageJsonProjectPath);
	expect(checkSimpleGitHooksInDependencies(config)).toBe(false);
});

// Set and remove git hooks

// Correct configurations

const projectWithConfigurationInPackageJsonPath = path.normalize(
	path.join(fixturesFolder, 'project_with_configuration_in_package_json')
);
const projectWithConfigurationInSeparateCjsPath = path.normalize(
	path.join(fixturesFolder, 'project_with_configuration_in_separate_cjs')
);
const projectWithConfigurationInAlternativeSeparateCjsPath = path.normalize(
	path.join(
		fixturesFolder,
		'project_with_configuration_in_alternative_separate_cjs'
	)
);
const projectWithUnusedConfigurationInPackageJsonPath = path.normalize(
	path.join(fixturesFolder, 'project_with_unused_configuration_in_package_json')
);

// Incorrect configurations

/**
 * Creates .git/hooks dir from root
 * @param root
 */
function createGitHooksFolder(root: string) {
	if (fs.existsSync(root + '/.git')) {
		return;
	}

	fs.mkdirSync(root + '/.git');
	fs.mkdirSync(root + '/.git/hooks');
}

/**
 * Removes .git directory from root
 * @param root
 */
function removeGitHooksFolder(root: string) {
	if (fs.existsSync(root + '/.git')) {
		fs.rmSync(root + '/.git', { recursive: true });
	}
}

/**
 * Returns all installed git hooks
 */
function getInstalledGitHooks(hooksDir: string): Record<string, string> {
	const result = {} as Record<string, string>;

	const hooks = fs.readdirSync(hooksDir);

	for (const hook of hooks) {
		result[hook] = fs
			.readFileSync(path.normalize(path.join(hooksDir, hook)))
			.toString();
	}

	return result;
}

const getHookDefaultCommand = (projectPath: string, hook: string) =>
	`#!/bin/sh\npnpm exec node-ts ${JSON.stringify(
		path.join(projectPath, `./scripts/hooks/${hook}.ts`)
	)} $@`;

const projectWithHookScriptsFolder = path.normalize(
	path.join(fixturesFolder, 'project_with_hook_scripts_folder')
);
test('creates git hooks if the scripts/hooks folder is present', () => {
	createGitHooksFolder(projectWithHookScriptsFolder);

	const config = getTestConfig(projectWithHookScriptsFolder);

	setHooksFromConfig(config);

	const installedHooks = getInstalledGitHooks(
		path.normalize(path.join(projectWithHookScriptsFolder, '.git', 'hooks'))
	);

	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': getHookDefaultCommand(
				projectWithHookScriptsFolder,
				'pre-commit'
			),
		})
	);
});

test('creates git hooks if configuration is correct from lion-git-hooks.config.cjs', () => {
	createGitHooksFolder(projectWithConfigurationInAlternativeSeparateCjsPath);

	const config = getTestConfig(
		projectWithConfigurationInAlternativeSeparateCjsPath
	);
	setHooksFromConfig(config);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(
				projectWithConfigurationInAlternativeSeparateCjsPath,
				'.git',
				'hooks'
			)
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': `#!/bin/sh\nexit 1`,
			'pre-push': `#!/bin/sh\nexit 1`,
		})
	);

	removeGitHooksFolder(projectWithConfigurationInAlternativeSeparateCjsPath);
});

test('creates git hooks if configuration is correct from lion-git-hooks.cjs', () => {
	createGitHooksFolder(projectWithConfigurationInSeparateCjsPath);

	const config = getTestConfig(projectWithConfigurationInSeparateCjsPath);
	setHooksFromConfig(config);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInSeparateCjsPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': getHookDefaultCommand(
				projectWithConfigurationInSeparateCjsPath,
				'pre-commit'
			),
		})
	);

	removeGitHooksFolder(projectWithConfigurationInSeparateCjsPath);
});

test('creates git hooks if configuration is correct from package.json', () => {
	createGitHooksFolder(projectWithConfigurationInPackageJsonPath);

	const config = getTestConfig(projectWithConfigurationInPackageJsonPath);
	setHooksFromConfig(config);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInPackageJsonPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': '#!/bin/sh\nexit 1',
		})
	);

	removeGitHooksFolder(projectWithConfigurationInPackageJsonPath);
});

test('removes git hooks', () => {
	createGitHooksFolder(projectWithConfigurationInPackageJsonPath);

	const config = getTestConfig(projectWithConfigurationInPackageJsonPath);
	setHooksFromConfig(config);

	let installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInPackageJsonPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({ 'pre-commit': `#!/bin/sh\nexit 1` })
	);

	removeHooks(config);

	installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInPackageJsonPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(JSON.stringify({}));

	removeGitHooksFolder(projectWithConfigurationInPackageJsonPath);
});

test('creates git hooks and removes unused git hooks', () => {
	createGitHooksFolder(projectWithConfigurationInPackageJsonPath);

	const installedHooksDir = path.normalize(
		path.join(projectWithConfigurationInPackageJsonPath, '.git', 'hooks')
	);

	fs.writeFileSync(path.resolve(installedHooksDir, 'pre-push'), '# do nothing');

	let installedHooks = getInstalledGitHooks(installedHooksDir);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({ 'pre-push': '# do nothing' })
	);

	const config = getTestConfig(projectWithConfigurationInPackageJsonPath);
	setHooksFromConfig(config);

	installedHooks = getInstalledGitHooks(installedHooksDir);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({ 'pre-commit': `#!/bin/sh\nexit 1` })
	);

	removeGitHooksFolder(projectWithConfigurationInPackageJsonPath);
});

test('creates git hooks and removes unused but preserves specific git hooks', () => {
	createGitHooksFolder(projectWithUnusedConfigurationInPackageJsonPath);

	const installedHooksDir = path.normalize(
		path.join(projectWithUnusedConfigurationInPackageJsonPath, '.git', 'hooks')
	);

	fs.writeFileSync(
		path.resolve(installedHooksDir, 'commit-msg'),
		'# do nothing'
	);
	fs.writeFileSync(path.resolve(installedHooksDir, 'pre-push'), '# do nothing');

	let installedHooks = getInstalledGitHooks(installedHooksDir);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({ 'commit-msg': '# do nothing', 'pre-push': '# do nothing' })
	);

	const config = getTestConfig(projectWithUnusedConfigurationInPackageJsonPath);
	setHooksFromConfig(config);

	installedHooks = getInstalledGitHooks(installedHooksDir);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'commit-msg': '# do nothing',
		})
	);

	removeGitHooksFolder(projectWithUnusedConfigurationInPackageJsonPath);
});
