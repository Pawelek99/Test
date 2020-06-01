require('./extensions');
const utils = require('./utils');
const api = require('./api');
const sh = require('./shell');

const showHelp = () => {
	sh.echo(
		`
		Creates an issue with the given name and assignes it to you.
		Use this script instead of creating issues through the browser
		because this way the issue will be marked with the correct label and appropriate branch will be created and linked.
		After creating issue you will be switched to the newly created branch.
		Keep in mind that this branch automatically will be pushed.

		Usage:  itg [issue|i] [-h] <name> [-b|-c <label>] [--from <issue|'master'>] [-d]
		        itg [issue|i] open <issue>
		        itg [issue|i] close [<'wont-do'|'done'>]
		Options:
		  -h, --help, -help, h, help, ?   displays this help message
		  -b, --bug                       sets 'bug' label to the newly created issue
		  -c, --custom <label>            sets the given label to the newly created issue. Label have to exist.
		  --from <issue number|'master'>  allows to choose a base branch by selecting base issue
		  -d, --detached                  allows to create an issue without switching to the created branch
		  open <issue number>             changes branch to the one associated with the given issue and assignes it to you
		  close [<'wont-do'|'done'>]      closes current issue; adds a comment with 'wont-do' or 'done' (default) description accordingly 
		                                    and switches you to a master branch; if you want to provide a custom comment pass it as a parameter
		                                    instead of 'wont-do' or 'done'

		Prefix 'issue|i' can be omitted.
  `.trimIndent(),
	);
	sh.exit(0);
};

const parseArgs = (args) => {
	const options = {};
	for (let i = 0; i < args.length; i++) {
		if (['-h', '--help', '-help', 'h', 'help', '?'].indexOf(args[i]) !== -1) {
			showHelp();
		} else if (['-b', '--bug'].indexOf(args[i]) !== -1) {
			options.bug = true;
		} else if (['-c', '--custom'].indexOf(args[i]) !== -1) {
			options.custom = args[i + 1];

			// Skip checking 'custom' parameter
			i++;
		} else if (['--from'].indexOf(args[i]) !== -1) {
			options.from = args[i + 1];

			// Skip checking 'from' parameter
			i++;
		} else if (['-d', '--detached'].indexOf(args[i]) !== -1) {
			options.detached = true;
		} else if (['open'].indexOf(args[i]) !== -1) {
			options.open = args[i + 1];

			// Skip checking 'open' parameter
			i++;
		} else if (['close'].indexOf(args[i]) !== -1) {
			options.close = args[i + 1];

			// Skip checking 'close' parameter
			i++;
		} else {
			// Add as not named option (such as issue title)
			options.title = args[i];
		}
	}

	return validateOptions(options);
};

const validateOptions = async (tempOptions) => {
	const options = {};

	// Validate 'open'
	if (tempOptions.hasOwnProperty('open')) {
		if (!tempOptions.open) {
			sh.echo('You have to pass an issue number to "open" option');
			sh.exit(1);
		}

		// User typed more options than just "open <issue>"
		if (Object.keys(tempOptions).length > 1) {
			sh.echo('You cannot use option "open" with other options');
			sh.exit(1);
		}

		options.open = await validateOpen(tempOptions.open);

		// Return now to avoid checking other options
		return options;
	}

	// Validate 'close'
	if (tempOptions.hasOwnProperty('close')) {
		// User typed more options than just "close [<'wont-do'|'done'>]"
		if (Object.keys(tempOptions).length > 1) {
			sh.echo('You cannot use option "close" with other options');
			sh.exit(1);
		}

		options.close = await validateClose(tempOptions.close);

		// Return now to avoid checking other options
		return options;
	}

	// Validate title
	if (!tempOptions.title) {
		sh.echo('You have to pass an issue title as a parameter');
		sh.exit(1);
	}

	options.title = tempOptions.title;

	// Validate 'custom' (ignore 'bug' if 'custom' is valid)
	if (tempOptions.hasOwnProperty('custom')) {
		if (!tempOptions.custom) {
			sh.echo('You have to pass a label to "--custom" option');
			sh.exit(1);
		}

		options.label = await validateCustom(tempOptions.custom);
	} else if (tempOptions.bug) {
		options.label = 'bug';
	} else {
		options.label = 'feature';
	}

	// Validate 'from'
	if (tempOptions.hasOwnProperty('from')) {
		if (!tempOptions.from) {
			sh.echo(
				'You have to pass an issue number or "master" to "--from" option',
			);
			sh.exit(1);
		}

		options.from = await validateFrom(tempOptions.from);
	} else {
		options.from = utils.getCurrentBranchName();
	}

	// Validate 'detached'
	if (tempOptions.detached) {
		options.detached = true;
	}

	return options;
};

const validateCustom = async (custom) => {
	if (!custom) {
		sh.echo('You have to pass a label');
		sh.exit(1);
	}

	// Download labels from Github repo
	const labels = (await api.getLabels()).map((label) => label.name);

	if (labels.indexOf(custom) === -1) {
		sh.echo(`You have to provide a label from: [${labels.join(', ')}]`);
		sh.exit(1);
	}
	return custom;
};

const validateFrom = async (from) => {
	if (from === 'master') {
		return 'master';
	}

	if (!utils.validateNumber(from)) {
		sh.echo(
			'Parameter passed to "--from" have to be an issue number or "master"',
		);
		sh.exit(1);
	}

	return utils.getBranchNameFromNumber(from);
};

const validateOpen = async (open) => {
	if (!utils.validateNumber(open)) {
		sh.echo('Parameter passed to "open" have to be an issue number');
		sh.exit(1);
	}

	const issue = await api.getIssue(open);

	return {
		branch: utils.getBranchName(issue.title, issue.number),
		number: issue.number,
		id: issue.id,
	};
};

const validateClose = async (close) => {
	if (close === 'wont-do') {
		return "Closing issue. It won't be done.";
	}

	return close === 'done' || !close
		? 'Closing issue. It has been done already.'
		: close;
};

const runCommands = async (options) => {
	if (options.open) {
		await runOpen(options.open);
		sh.exit(0);
	}

	if (options.close) {
		await runClose(options.close);
		sh.exit(0);
	}

	// Creating an issue
	sh.echo(
		`Creating issue with name: "${options.title}", labeled: "${options.label}"`,
	);

	let assignee = undefined;
	if (!options.detached) {
		sh.echo('Assigning this issue to you');

		const user = await api.getUser();
		assignee = user.id;
	}

	const issue = await api.createIssue(options.title, options.label, assignee);

	if (!issue) {
		sh.echo('Something went wrong with creating issue');
		sh.exit(1);
	}

	sh.echo(`Created issue: #${issue.number}`);

	// Creating a custom branch
	const branchName = utils.getBranchName(options.title, issue.number);

	sh.echo(`Creating branch "${branchName}" based on "${options.from}"`);

	sh.exec(`git push origin origin/${options.from}:refs/heads/${branchName}`);

	if (!options.detached) {
		sh.echo('Checking out created branch');

		const hasUncommitedChanges = sh.exec('git status -s').trimEndline() != '';
		if (hasUncommitedChanges) {
			sh.exec('git stash');
		}

		sh.exec(`git checkout ${branchName}`);

		if (hasUncommitedChanges) {
			sh.exec('git stash pop');
		}
	}

	// Adding description to the issue
	const branchLink = await utils.getBranchLink(branchName);
	const description = `Associated branch: [${branchName}](${branchLink})`;

	const result = await api.updateIssue(issue.id, description);

	if (!result) {
		sh.echo('Something went wrong with setting issue description');
		sh.exit(1);
	}

	sh.exit(0);
};

const runOpen = async (open) => {
	sh.echo(
		`Checking out branch "${open.branch}" associated with issue #${open.number}`,
	);

	// Check if remote branch with this name exist
	if (sh.exec(`git ls-remote origin ${open.branch}`).code !== 0) {
		sh.echo(`Remote branch "${open.branch}" does not exist`);
		sh.exit(1);
	}

	// Check if local branch with this name exist
	if (
		sh.exec(`git show-ref --verify --quiet refs/heads/${open.branch}`).code ===
		0
	) {
		// Checkout local branch
		if (sh.exec(`git checkout ${open.branch}`).code !== 0) {
			sh.echo(
				'We had a problem with checking out the branch. Maybe stash changes before trying again?',
			);
			sh.exit(1);
		}

		// Pull changes from remote
		sh.exec(`git pull origin ${open.branch}`);
	} else {
		// Checkout and track remote branch
		if (sh.exec(`git checkout --track origin/${open.branch}`).code !== 0) {
			sh.echo(
				'We had a problem with checking out the branch. Maybe stash changes before trying again?',
			);
			sh.exit(1);
		}
	}

	sh.echo(`Assigning issue #${open.number} to you`);
	const user = await api.getUser();
	await api.updateIssue(open.id, undefined, user.id);

	sh.exit(0);
};

const runClose = async (close) => {
	const issueNumber = utils.getCurrentIssueNumber();
	sh.echo(`Closing issue #${issueNumber}; reason: "${close}"`);

	const issue = await api.getIssue(issueNumber);
	await api.closeIssue(issue.id, close);

	const hasUncommitedChanges = sh.exec('git status -s').trimEndline() != '';
	if (hasUncommitedChanges) {
		sh.exec('git stash');
	}

	sh.echo('Checking out "master" branch');
	sh.exec('git checkout master');

	sh.echo('Pulling changes from "origin master" branch');
	sh.exec('git pull origin master');

	if (hasUncommitedChanges) {
		sh.exec('git stash pop');
	}

	sh.exit(0);
};

const issue = async (args) => {
	await runCommands(await parseArgs(args));
};

module.exports = issue;
