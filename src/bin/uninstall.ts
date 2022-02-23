/**
 * Removes the pre-commit from command in config by default
 */
import { removeHooks } from '~/utils/git-hooks.js';
import { getConfig } from '~/utils/config.js';

console.info('[INFO] Removing git hooks from .git/hooks');

try {
	removeHooks(getConfig());
	console.info('[INFO] Successfully removed all git hooks');
} catch (error: unknown) {
	console.info(
		"[INFO] Couldn't remove git hooks. Reason: " + (error as Error).message
	);
}
