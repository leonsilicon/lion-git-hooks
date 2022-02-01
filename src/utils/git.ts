import { findUpSync } from 'find-up';

export const VALID_GIT_HOOKS = [
	'applypatch-msg',
	'pre-applypatch',
	'post-applypatch',
	'pre-commit',
	'pre-merge-commit',
	'prepare-commit-msg',
	'commit-msg',
	'post-commit',
	'pre-rebase',
	'post-checkout',
	'post-merge',
	'pre-push',
	'pre-receive',
	'update',
	'proc-receive',
	'post-receive',
	'post-update',
	'reference-transaction',
	'push-to-checkout',
	'pre-auto-gc',
	'post-rewrite',
	'sendemail-validate',
	'fsmonitor-watchman',
	'p4-changelist',
	'p4-prepare-changelist',
	'p4-post-changelist',
	'p4-pre-submit',
	'post-index-change',
];

export function getGitProjectRoot(): string {
	const gitProjectRoot = findUpSync('.git');

	if (gitProjectRoot === undefined) {
		throw new Error('.git project root not found');
	}

	return gitProjectRoot;
}
