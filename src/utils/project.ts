import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import type { PackageJson } from 'type-fest';

/**
 * Transforms the <project>/node_modules/lion-git-hooks to <project>
 * @param projectPath - path to the lion-git-hooks in node modules
 * @return an absolute path to the project or undefined if projectPath is not in node_modules
 */
export function getProjectRootDirectoryFromNodeModules(
	projectPath: string
): string | undefined {
	function arraysAreEqual(a1: unknown[], a2: unknown[]) {
		return JSON.stringify(a1) === JSON.stringify(a2);
	}

	const projDir = projectPath.split(/[\\/]/); // <- would split both on '/' and '\'

	const indexOfPnpmDir = projDir.indexOf('.pnpm');
	if (indexOfPnpmDir > -1) {
		return projDir.slice(0, indexOfPnpmDir - 1).join('/');
	}

	// A yarn2 STAB
	if (projDir.includes('.yarn') && projDir.includes('unplugged')) {
		return undefined;
	}

	if (
		projDir.length > 2 &&
		arraysAreEqual(projDir.slice(-2, projDir.length), [
			'node_modules',
			'lion-git-hooks',
		])
	) {
		return projDir.slice(0, -2).join('/');
	}

	return undefined;
}

/** Reads package.json file, returns package.json content and path
 * @param projectPath - a path to the project, defaults to process.cwd
 * @return {{packageJsonContent: any, packageJsonPath: string}}
 * @throws TypeError if projectPath is not a string
 * @throws Error if cant read package.json
 * @private
 */
export function getPackageJson(projectPath: string = process.cwd()): {
	packageJsonContent: PackageJson;
	packageJsonPath: string;
} {
	if (typeof projectPath !== 'string') {
		throw new TypeError('projectPath is not a string');
	}

	const targetPackageJson = path.normalize(projectPath + '/package.json');

	if (!fs.statSync(targetPackageJson).isFile()) {
		throw new Error("Package.json doesn't exist");
	}

	const packageJsonDataRaw = fs.readFileSync(targetPackageJson);
	return {
		packageJsonContent: JSON.parse(
			packageJsonDataRaw.toString()
		) as PackageJson,
		packageJsonPath: targetPackageJson,
	};
}
