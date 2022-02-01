import { cosmiconfig } from 'cosmiconfig';
import { packageDirectorySync } from 'pkg-dir';
import type { PartialDeep } from 'type-fest';
import type {
	LionGitHooksConfig,
	UserLionGitHooksConfig,
} from '~/types/config.js';
import { VALID_GIT_HOOKS } from '~/utils/git.js';

export async function getConfig() {
	const explorer = cosmiconfig('lion-git-hooks', {
		stopDir: packageDirectorySync(),
	});

	const results = await explorer.search();
	if (results === null) {
		throw new Error('lion-git-hooks config not found.');
	}

	const config = results.config as PartialDeep<UserLionGitHooksConfig>;

	return config;
}

const VALID_OPTIONS = new Set(['preserveUnused']);

/**
 * Validates the config, checks that every git hook or option is named correctly
 * @param config
 */
export function validateConfig(config: LionGitHooksConfig): boolean {
	for (const hookOrOption in config.hooks) {
		if (
			!VALID_GIT_HOOKS.includes(hookOrOption) &&
			!VALID_OPTIONS.has(hookOrOption)
		) {
			return false;
		}
	}

	return true;
}
