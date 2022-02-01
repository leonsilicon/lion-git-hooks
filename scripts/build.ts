import { execaCommandSync as exec } from 'execa';
import { chProjectDir, copyPackageFiles } from 'lion-system';

chProjectDir(import.meta.url);
exec('tsc');
exec('tsc-alias');
copyPackageFiles();
