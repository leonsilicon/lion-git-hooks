export type UserHookConfig = {
	noCi: boolean;
	ciOnly: boolean;
	file: string;
	command: string;
};

export type HookConfig = Omit<UserHookConfig, 'file'>;

export type LionGitHooksConfig = {
	projectPath: string;
	noCi: boolean;
	ciOnly: boolean;
	/**
	 * Whether to keep unused hooks (i.e. don't remove them)
	 */
	preserveUnused: string[] | false;
	hooks: Record<string, HookConfig>;
};

export type UserLionGitHooksConfig = Omit<
	Partial<LionGitHooksConfig>,
	'hooks'
> & {
	hooks?: Record<string, Partial<UserHookConfig>>;
};
