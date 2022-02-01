module.exports = {
	hooks: {
		'pre-push': {
			command: 'exit 1',
		},
		'pre-commit': {
			command: 'exit 1',
		},
	},
};
