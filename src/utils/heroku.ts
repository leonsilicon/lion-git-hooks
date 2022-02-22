import process from 'node:process';

export function isHeroku() {
	return (
		'HEROKU' in process.env ||
		('DYNO' in process.env && process.env.HOME === '/app')
	);
}
