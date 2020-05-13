require('dotenv').config();
const f = require('node-fetch');
const sh = require('shelljs');

Object.prototype.fromPath = function (...path) {
  return path.reduce((xs, x) => (xs && xs[x]) ? xs[x] : null, this);
};

const getAuthHeaders = () => {
  return {
    'Authorization': `bearer ${process.env.TOKEN}`
  };
};

const mutation = async (mutation) => {
  return query(mutation, true);
}

const query = async (query, isMutation) => {
  const body = `{ "query": "${isMutation ? 'mutation' : ''} { ${query.replace(/\n| +/g, ' ').replace(/"/g, '\\"')} }" }`;
  console.log(body);
  const res = await f(process.env.API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body,
  });
  return await res.json();
};

const queryRepo = async (repoQuery) => {
  const repoName = sh.exec('basename $(git remote get-url origin) .git').trimEndline();
  const user = await methods.getUser();
  return query(`repository(name: "${repoName}", owner: "${user.login}") { ${repoQuery} }`);
}

const methods = {
  getRepo: async () => {
    const repo = await queryRepo(`id name url`);
    return repo.fromPath('data', 'repository');
  },

  getUser: async () => {
    const user = await query(`viewer { id login }`);
    return user.fromPath('data', 'viewer');
  },

  getIssue: async (issueNumber, withLabels) => {
    let issue = await queryRepo(`issue(number: ${issueNumber}) { id number title ${withLabels ? 'labels(first: 10) { nodes { name id } }' : ''} }`);
    issue = issue.fromPath('data', 'repository', 'issue');
    if (withLabels) {
      issue.labels = issue.labels.nodes.map(l => ({ name: l.name, id: l.id }));
    }
    return issue;
  },

  getPrNumberFromBranch: async (branch) => {
    const prNumber = await queryRepo(`pullRequests(headRefName: "${branch}", last: 1, states: OPEN) { nodes { number } }`);
    return prNumber.fromPath('data', 'repository', 'pullRequests', 'nodes', '0', 'number');
  },

  getLabels: async () => {
    const labels = await queryRepo(`labels(first: 50) { nodes { name } }`);
    return labels.fromPath('data', 'repository', 'labels', 'nodes').map((l) => l.name);
  },

  getLabel: async (name) => {
    const label = await queryRepo(`label(name: "${name}") { id name }`);
    return label.fromPath('data', 'repository', 'label');
  },

  createIssue: async (title, labels, assignee) => {
    const repo = await methods.getRepo();
    const labelsIds = [];
    console.log(labels);
    await labels.split(',').asyncForEach(async (label) => {
      labelsIds.push((await methods.getLabel(label)).id);
    });
    console.log(labelsIds);
    const issue = await mutation(`createIssue(input: {
      repositoryId: "${repo.id}", title: "${title}"${assignee ? `, assigneeIds: "${assignee}"` : ''}, labelIds: "${labelsIds.join(',')}"
    }) { issue { id url number } }`);
    console.log(issue);
    return issue.fromPath('data', 'createIssue', 'issue');
  },

  updateIssue: async (id, body, assignee) => {
    const issue = await mutation(`updateIssue(input: {
      id: "${id}"${body ? `, body: "${body}"` : ''}${assignee ? `, assigneeIds: "${assignee}"` : ''}
    }) { issue { id url number } }`);
    return issue.fromPath('data', 'updateIssue', 'issue');
  },

  createPullRequest: async (issue, options) => {
    const pr = await mutation(`createPullRequest(input: {
      repositoryId: "${repo.id}", baseRefName: "${options.from}", headRefName: "${options.to}", title: "${issue.name}", draft: ${options.draft === true}
    }) { id number url }`);
    return pr.fromPath('data', 'createPullRequest', 'pullRequest');
  }
};

module.exports = methods;