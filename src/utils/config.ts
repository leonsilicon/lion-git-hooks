import { cosmiconfig } from 'cosmiconfig';
import { validateHooks } from './git-hooks.js';
import type { LionGitHooksConfig } from '~/types/config.js';

export async function getConfig(projectRootPath: string) {
	if (typeof projectRootPath !== 'string') {
		throw new TypeError(
			'Check project root path! Expected a string, but got ' +
				typeof projectRootPath
		);
	}

	const explorer = cosmiconfig('lion-git-hooks', {
		stopDir: projectRootPath,
	});

	const results = await explorer.search();
	const config = results?.config as LionGitHooksConfig;

	if (config && validateHooks(config)) {
		return config;
	} else if (config && !validateHooks(config)) {
		throw new Error(
			'[ERROR] Config was not in correct format. Please check git hooks or options name'
		);
	}
}
