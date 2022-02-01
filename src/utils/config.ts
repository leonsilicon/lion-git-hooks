import path from 'node:path';
import process from 'node:process';
import { cosmiconfigSync } from 'cosmiconfig';
import { globbySync } from 'globby';
import type {
	HookConfig,
	LionGitHooksConfig,
	UserLionGitHooksConfig,
} from '~/types/config.js';
import { getGitProjectRoot, VALID_GIT_HOOKS } from '~/utils/git.js';

/**
 * Gets the user-supplied config
 */
export function getUserConfig(cwd?: string): UserLionGitHooksConfig {
	const explorer = cosmiconfigSync('lion-git-hooks');

	const results = explorer.search(cwd);
	if (results === null) {
		return {};
	}

	return results.config as UserLionGitHooksConfig;
}

export function getHookConfig(
	userConfig: UserLionGitHooksConfig,
	hook: string
): HookConfig | undefined {
	const rootPath = getGitProjectRoot(userConfig);
	const providedHookOptions = userConfig.hooks?.[hook];

	const defaultHookOptions = {
		noCi: true,
		ciOnly: false,
	};

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
		hookCommand = `pnpm exec node-ts ${JSON.stringify(
			providedHookOptions.file
		)}`;
	} else {
		const matches = globbySync([
			path.join(rootPath, `./scripts/hooks/${hook}.*`),
			path.join(rootPath, `./scripts/src/hooks/${hook}.*`),
		]);

		if (matches.length === 0) {
			if (providedHookOptions === undefined) {
				return undefined;
			} else {
				console.log(hook, userConfig, providedHookOptions);
				throw new Error(`file for hook ${hook} was not found.`);
			}
		}

		hookCommand = `pnpm exec node-ts ${JSON.stringify(matches[0]!)}`;
	}

	return {
		...defaultHookOptions,
		...providedHookOptions,
		command: hookCommand,
	};
}

/**
 * Merges the user-supplied config with the default configs
 */
export function getConfig(
	customOptions?: Partial<LionGitHooksConfig>
): LionGitHooksConfig {
	const userConfig = {
		...getUserConfig(customOptions?.projectPath),
		...customOptions,
	};

	const hooksConfigs = {} as Record<string, HookConfig>;

	if (userConfig.hooks !== undefined) {
		for (const hook of Object.keys(userConfig.hooks)) {
			hooksConfigs[hook] = getHookConfig(userConfig, hook)!;
		}
	}

	const defaultConfig = {
		noCi: true,
		ciOnly: false,
		preserveUnused: false,
		projectPath: process.cwd(),
	} as const;

	return {
		...defaultConfig,
		...userConfig,
		hooks: hooksConfigs,
	};
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
