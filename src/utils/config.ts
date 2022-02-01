import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { getPackageJson } from './project.js';
import { validateHooks } from './git-hooks.js';

/**
 * Takes the first argument from current process argv and returns it
 * Returns empty string when argument wasn't passed
 */
export function getCustomConfigPath(argv: string[] = []): string {
	const cmdIdx = argv.indexOf('simple-git-hooks');

	if (cmdIdx === -1) return '';

	return argv[cmdIdx + 1] ?? '';
}

/**
 * Gets user-set command either from sources
 * First try to get command from .simple-pre-commit.json
 * If not found -> try to get command from package.json
 * @param {string} projectRootPath
 * @param {string} [configFileName]
 * @throws TypeError if projectRootPath is not string
 * @return {{string: string} | undefined}
 * @private
 */
export function getConfig(projectRootPath: string, configFileName = '') {
	if (typeof projectRootPath !== 'string') {
		throw new TypeError(
			'Check project root path! Expected a string, but got ' +
				typeof projectRootPath
		);
	}

	// Every function here should accept projectRootPath as first argument and return object
	const sources = [
		() => getConfigFromFile(projectRootPath, '.simple-git-hooks.cjs'),
		() => getConfigFromFile(projectRootPath, '.simple-git-hooks.js'),
		() => getConfigFromFile(projectRootPath, 'simple-git-hooks.cjs'),
		() => getConfigFromFile(projectRootPath, 'simple-git-hooks.js'),
		() => getConfigFromFile(projectRootPath, '.simple-git-hooks.json'),
		() => getConfigFromFile(projectRootPath, 'simple-git-hooks.json'),
		() => getConfigFromPackageJson(projectRootPath),
	];

	// If user pass his-own config path prepend custom path before the default ones
	if (configFileName) {
		sources.unshift(() => getConfigFromFile(projectRootPath, configFileName));
	}

	for (const executeSource of sources) {
		const config = executeSource();
		if (config && validateHooks(config)) {
			return config;
		} else if (config && !validateHooks(config)) {
			throw new Error(
				'[ERROR] Config was not in correct format. Please check git hooks or options name'
			);
		}
	}

	return undefined;
}

/**
 * Gets current config from package.json[simple-pre-commit]
 * @param projectRootPath
 * @throws TypeError if packageJsonPath is not a string
 * @throws Error if package.json couldn't be read or was not validated
 */
function getConfigFromPackageJson(
	projectRootPath: string = process.cwd()
): Record<string, string> | undefined {
	const { packageJsonContent } = getPackageJson(projectRootPath);

	return (
		packageJsonContent as {
			'simple-git-hooks': Record<string, string> | undefined;
		}
	)['simple-git-hooks'];
}

/**
 * Gets user-set config from file
 * Since the file is not required in node.js projects it returns undefined if something is off
 * @param projectRootPath
 * @param fileName
 */
function getConfigFromFile(
	projectRootPath: string,
	fileName: string
): Record<string, string> | undefined {
	if (typeof projectRootPath !== 'string') {
		throw new TypeError('projectRootPath is not a string');
	}

	if (typeof fileName !== 'string') {
		throw new TypeError('fileName is not a string');
	}

	try {
		const filePath = path.normalize(projectRootPath + '/' + fileName);
		if (filePath === fileURLToPath(import.meta.url)) {
			return undefined;
		}

		const require = createRequire(import.meta.url);

		return require(filePath) as Record<string, string>; // Handle `.js` and `.json`
	} catch {
		return undefined;
	}
}
