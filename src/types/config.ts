export type UserHookOptions = {
	noCi: boolean;
	ciOnly: boolean;
	file: string;
	command: string;
};

export type HookOptions = Omit<UserHookOptions, 'file'>;

export type LionGitHooksConfig = {
	noCi: boolean;
	ciOnly: boolean;
	/**
	 * Whether to keep unused hooks (i.e. don't remove them)
	 */
	preserveUnused: string[] | undefined;
	hooks: Record<string, HookOptions>;
};

export type UserLionGitHooksConfig = Omit<LionGitHooksConfig, 'hooks'> & {
	hooks: Record<string, UserHookOptions>;
};
