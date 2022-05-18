#!/usr/bin/env node

/**
 * Creates the pre-commit from command in config by default
 */
import isHeroku from 'is-heroku';
import process from 'node:process';

import { getConfig } from '~/utils/config.js';
import {
	checkSimpleGitHooksInDependencies,
	setHooksFromConfig,
} from '~/utils/git-hooks.js';
import { getProjectRootDirectoryFromNodeModules } from '~/utils/project.js';

if (isHeroku) {
	console.info('[INFO] Skipped setting hooks on Heroku.');
	process.exit(0);
}

let projectDirectory;

/* When script is run after install, the process.cwd() would be like <project_folder>/node_modules/lion-git-hooks
       Here we try to get the original project directory by going upwards by 2 levels
       If we were not able to get new directory we assume, we are already in the project root */
const parsedProjectDirectory = getProjectRootDirectoryFromNodeModules(
	process.cwd()
);
if (parsedProjectDirectory === undefined) {
	projectDirectory = process.cwd();
} else {
	projectDirectory = parsedProjectDirectory;
}

const config = getConfig({
	projectPath: projectDirectory,
});

if (checkSimpleGitHooksInDependencies(config)) {
	try {
		setHooksFromConfig(config);
	} catch (error: unknown) {
		console.error(
			'[ERROR] Was not able to set git hooks. Reason: ' +
				(error as Error).message
		);
	}
}
