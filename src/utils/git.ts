import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';

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

/**
 * Recursively gets the .git folder path from provided directory
 * @param {string} directory
 * @return {string | undefined} .git folder path or undefined if it was not found
 */
export function getGitProjectRoot(
	directory: string | string[] = process.cwd()
): string | undefined {
	let start: string | string[] = directory;
	if (typeof start === 'string') {
		if (!start.endsWith(path.sep)) {
			start += path.sep;
		}

		start = path.normalize(start).split(path.sep);
	}

	if (start.length === 0) {
		return undefined;
	}

	start.pop();

	const dir = start.join(path.sep);
	const fullPath = path.join(dir, '.git');

	if (fs.existsSync(fullPath)) {
		if (!fs.lstatSync(fullPath).isDirectory()) {
			const content = fs.readFileSync(fullPath, { encoding: 'utf-8' });
			const match = /^gitdir: (.*)\s*$/.exec(content);
			if (match) {
				return path.normalize(match[1]!);
			}
		}

		return path.normalize(fullPath);
	} else {
		return getGitProjectRoot(start);
	}
}
