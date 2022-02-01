/**
 * A CLI tool to change the git hooks to commands from config
 */
import process from 'node:process';
import isCi from 'is-ci';
import minimist from 'minimist';
import { setHooksFromConfig, getConfig } from './utils/index.js';

try {
	const argv = minimist(process.argv.slice(2));
	if (argv['no-ci'] && isCi) {
		console.info(
			'[INFO] Skipped setting hooks because a CI environment was detected and --no-ci was set'
		);
	}

	if (argv['ci-only'] && !isCi) {
		console.info(
			"[INFO] Skipped setting hooks because a CI environment wasn't detected and --ci-only was set."
		);
	}

	setHooksFromConfig(getConfig());
	console.info('[INFO] Successfully set all git hooks');
} catch (error: unknown) {
	console.error(
		'[ERROR], Was not able to set git hooks. Error: ' + (error as Error).message
	);
}
