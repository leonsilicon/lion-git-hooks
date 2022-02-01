/**
 * Creates the pre-commit from command in config by default
 */
import process from 'node:process';
import {
	getConfig,
	getProjectRootDirectoryFromNodeModules,
	checkSimpleGitHooksInDependencies,
	setHooksFromConfig,
} from '~/utils/index.js';

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
