import { removeHooks } from './utils/git-hooks.js';

/**
 * Removes the pre-commit from command in config by default
 */
function uninstall() {
	console.info('[INFO] Removing git hooks from .git/hooks');

	try {
		removeHooks();
		console.info('[INFO] Successfully removed all git hooks');
	} catch (error: unknown) {
		console.info(
			"[INFO] Couldn't remove git hooks. Reason: " + (error as Error).message
		);
	}
}

uninstall();
