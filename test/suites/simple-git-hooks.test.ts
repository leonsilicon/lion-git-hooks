import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from 'desm';
import type { PackageJson } from 'type-fest';
import {
	checkSimpleGitHooksInDependencies,
	getGitProjectRoot,
	getProjectRootDirectoryFromNodeModules,
	removeHooks,
	setHooksFromConfig,
} from '~/utils/index.js';

const rootPath = join(import.meta.url, '../..');

const packageJson = JSON.parse(
	fs.readFileSync(path.join(rootPath, './package.json')).toString()
) as PackageJson;

const packageVersion = packageJson.version!;

// Get project root directory

test('getProjectRootDirectory returns correct dir in typical case:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules(
			'var/my-project/node_modules/simple-git-hooks'
		)
	).toBe('var/my-project');
});

test('getProjectRootDirectory returns correct dir when used with windows delimiters:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules(
			'user\\allProjects\\project\\node_modules\\simple-git-hooks'
		)
	).toBe('user/allProjects/project');
});

test('getProjectRootDirectory falls back to undefined when we are not in node_modules:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules('var/my-project/simple-git-hooks')
	).toBe(undefined);
});

test('getProjectRootDirectory return correct dir when installed using pnpm:', () => {
	expect(
		getProjectRootDirectoryFromNodeModules(
			`var/my-project/node_modules/.pnpm/simple-git-hooks@${packageVersion}`
		)
	).toBe('var/my-project');
	expect(
		getProjectRootDirectoryFromNodeModules(
			`var/my-project/node_modules/.pnpm/simple-git-hooks@${packageVersion}/node_modules/simple-git-hooks`
		)
	).toBe('var/my-project');
});

// Get git root

const gitProjectRoot = path.normalize(path.join(rootPath, '.git'));
const currentPath = path.normalize(rootPath);
const currentFilePath = path.normalize(fileURLToPath(import.meta.url));

test('get git root works from .git directory itself', () => {
	expect(getGitProjectRoot(gitProjectRoot)).toBe(gitProjectRoot);
});

test('get git root works from any directory', () => {
	expect(getGitProjectRoot(currentPath)).toBe(gitProjectRoot);
});

test('get git root works from any file', () => {
	expect(getGitProjectRoot(currentFilePath)).toBe(gitProjectRoot);
});

// Check if simple-pre-commit is in devDependencies or dependencies in package json

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
	expect(checkSimpleGitHooksInDependencies(correctPackageJsonProjectPath)).toBe(
		true
	);
});

test('returns true if simple pre commit really in deps', () => {
	expect(
		checkSimpleGitHooksInDependencies(correctPackageJsonProjectPath2)
	).toBe(true);
});

test('returns false if simple pre commit isn`t in deps', () => {
	expect(
		checkSimpleGitHooksInDependencies(incorrectPackageJsonProjectPath)
	).toBe(false);
});

// Set and remove git hooks

// Correct configurations

const projectWithConfigurationInPackageJsonPath = path.normalize(
	path.join(fixturesFolder, 'project_with_configuration_in_package_json')
);
const projectWithConfigurationInSeparateCjsPath = path.normalize(
	path.join(fixturesFolder, 'project_with_configuration_in_separate_cjs')
);
const projectWithConfigurationInSeparateJsPath = path.normalize(
	path.join(fixturesFolder, 'project_with_configuration_in_separate_js')
);
const projectWithConfigurationInAlternativeSeparateCjsPath = path.normalize(
	path.join(
		fixturesFolder,
		'project_with_configuration_in_alternative_separate_cjs'
	)
);
const projectWithConfigurationInAlternativeSeparateJsPath = path.normalize(
	path.join(
		fixturesFolder,
		'project_with_configuration_in_alternative_separate_js'
	)
);
const projectWithConfigurationInSeparateJsonPath = path.normalize(
	path.join(fixturesFolder, 'project_with_configuration_in_separate_json')
);
const projectWithConfigurationInAlternativeSeparateJsonPath = path.normalize(
	path.join(
		fixturesFolder,
		'project_with_configuration_in_alternative_separate_json'
	)
);
const projectWithUnusedConfigurationInPackageJsonPath = path.normalize(
	path.join(fixturesFolder, 'project_with_unused_configuration_in_package_json')
);
const projectWithCustomConfigurationFilePath = path.normalize(
	path.join(fixturesFolder, 'project_with_custom_configuration')
);

// Incorrect configurations

const projectWithIncorrectConfigurationInPackageJson = path.normalize(
	path.join(
		fixturesFolder,
		'project_with_incorrect_configuration_in_package_json'
	)
);
const projectWithoutConfiguration = path.normalize(
	path.join(fixturesFolder, 'project_without_configuration')
);

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
		fs.rmdirSync(root + '/.git', { recursive: true });
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

test('creates git hooks if configuration is correct from .simple-git-hooks.js', () => {
	createGitHooksFolder(projectWithConfigurationInAlternativeSeparateJsPath);

	setHooksFromConfig(projectWithConfigurationInAlternativeSeparateJsPath);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(
				projectWithConfigurationInAlternativeSeparateJsPath,
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

	removeGitHooksFolder(projectWithConfigurationInAlternativeSeparateJsPath);
});

test('creates git hooks if configuration is correct from .simple-git-hooks.cjs', () => {
	createGitHooksFolder(projectWithConfigurationInAlternativeSeparateCjsPath);

	setHooksFromConfig(projectWithConfigurationInAlternativeSeparateCjsPath);
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

test('creates git hooks if configuration is correct from simple-git-hooks.cjs', () => {
	createGitHooksFolder(projectWithConfigurationInSeparateCjsPath);

	setHooksFromConfig(projectWithConfigurationInSeparateCjsPath);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInSeparateCjsPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': `#!/bin/sh\nexit 1`,
			'pre-push': `#!/bin/sh\nexit 1`,
		})
	);

	removeGitHooksFolder(projectWithConfigurationInSeparateCjsPath);
});

test('creates git hooks if configuration is correct from simple-git-hooks.js', () => {
	createGitHooksFolder(projectWithConfigurationInSeparateJsPath);

	setHooksFromConfig(projectWithConfigurationInSeparateJsPath);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInSeparateJsPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': `#!/bin/sh\nexit 1`,
			'pre-push': `#!/bin/sh\nexit 1`,
		})
	);

	removeGitHooksFolder(projectWithConfigurationInSeparateJsPath);
});

test('creates git hooks if configuration is correct from .simple-git-hooks.json', () => {
	createGitHooksFolder(projectWithConfigurationInAlternativeSeparateJsonPath);

	setHooksFromConfig(projectWithConfigurationInAlternativeSeparateJsonPath);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(
				projectWithConfigurationInAlternativeSeparateJsonPath,
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

	removeGitHooksFolder(projectWithConfigurationInAlternativeSeparateJsonPath);
});

test('creates git hooks if configuration is correct from simple-git-hooks.json', () => {
	createGitHooksFolder(projectWithConfigurationInSeparateJsonPath);

	setHooksFromConfig(projectWithConfigurationInSeparateJsonPath);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInSeparateJsonPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': `#!/bin/sh\nexit 1`,
			'pre-push': `#!/bin/sh\nexit 1`,
		})
	);

	removeGitHooksFolder(projectWithConfigurationInSeparateJsonPath);
});

test('creates git hooks if configuration is correct from package.json', () => {
	createGitHooksFolder(projectWithConfigurationInPackageJsonPath);

	setHooksFromConfig(projectWithConfigurationInPackageJsonPath);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInPackageJsonPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({ 'pre-commit': `#!/bin/sh\nexit 1` })
	);

	removeGitHooksFolder(projectWithConfigurationInPackageJsonPath);
});

test('fails to create git hooks if configuration contains bad git hooks', () => {
	createGitHooksFolder(projectWithIncorrectConfigurationInPackageJson);

	expect(() => {
		setHooksFromConfig(projectWithIncorrectConfigurationInPackageJson);
	}).toThrow(
		'[ERROR] Config was not in correct format. Please check git hooks or options name'
	);

	removeGitHooksFolder(projectWithIncorrectConfigurationInPackageJson);
});

test('fails to create git hooks if not configured', () => {
	createGitHooksFolder(projectWithoutConfiguration);

	expect(() => {
		setHooksFromConfig(projectWithoutConfiguration);
	}).toThrow(
		'[ERROR] Config was not found! Please add `.simple-git-hooks.js` or `simple-git-hooks.js` or `.simple-git-hooks.json` or `simple-git-hooks.json` or `simple-git-hooks` entry in package.json.'
	);

	removeGitHooksFolder(projectWithoutConfiguration);
});

test('removes git hooks', () => {
	createGitHooksFolder(projectWithConfigurationInPackageJsonPath);

	setHooksFromConfig(projectWithConfigurationInPackageJsonPath);

	let installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithConfigurationInPackageJsonPath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({ 'pre-commit': `#!/bin/sh\nexit 1` })
	);

	removeHooks(projectWithConfigurationInPackageJsonPath);

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

	setHooksFromConfig(projectWithConfigurationInPackageJsonPath);

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

	setHooksFromConfig(projectWithUnusedConfigurationInPackageJsonPath);

	installedHooks = getInstalledGitHooks(installedHooksDir);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'commit-msg': '# do nothing',
			'pre-commit': `#!/bin/sh\nexit 1`,
		})
	);

	removeGitHooksFolder(projectWithUnusedConfigurationInPackageJsonPath);
});

test('creates git hooks and removes unused but preserves specific git hooks', () => {
	createGitHooksFolder(projectWithCustomConfigurationFilePath);

	setHooksFromConfig(projectWithCustomConfigurationFilePath, [
		'npx',
		'simple-git-hooks',
		'./git-hooks.js',
	]);
	const installedHooks = getInstalledGitHooks(
		path.normalize(
			path.join(projectWithCustomConfigurationFilePath, '.git', 'hooks')
		)
	);
	expect(JSON.stringify(installedHooks)).toBe(
		JSON.stringify({
			'pre-commit': `#!/bin/sh\nexit 1`,
			'pre-push': `#!/bin/sh\nexit 1`,
		})
	);

	removeGitHooksFolder(projectWithCustomConfigurationFilePath);
});
