const openPr = document.getElementById('open-pr');
const closedPr = document.getElementById('closed-pr');
const openIssue = document.getElementById('open-issue');
const closedIssue = document.getElementById('closed-issue');
const repos = document.getElementById('repos');
let username;
let globalData = [];

const params = new URLSearchParams(window.location.search);
if (params.has('user')) {
  username = params.get('user');
} else {
  username = config.user;
}

let githubData = {
  'open-pr': {
    element: openPr,
    title: 'Open Pull Requests',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Apr+author%3A${username}+archived%3Afalse+is%3Aopen`,
    page: 1,
  },
  'closed-pr': {
    element: closedPr,
    title: 'Closed Pull Requests',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Apr+author%3A${username}+archived%3Afalse+is%3Aclosed`,
    page: 1,
  },
  'open-issue': {
    element: openIssue,
    title: 'Open Issues',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Aissue+author%3A${username}+archived%3Afalse+is%3Aopen`,
    page: 1,
  },
  'closed-issue': {
    element: closedIssue,
    title: 'Closed Issues',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Aissue+author%3A${username}+archived%3Afalse+is%3Aclosed`,
    page: 1,
  },
};

const elements = ['open-pr', 'closed-pr', 'open-issue', 'closed-issue'];
const loadingElement = `<div class="loading-container">
												<div class="loading" ></div>
												</div>`;
async function initPage() {
  setLoading(true);
  try {
    let [openPrData, closedPrData, openIssueData, closedIssueData] =
      await Promise.all(elements.map((data) => fetchGithub(data)));

    githubData['open-pr'].data = openPrData.items;
    githubData['closed-pr'].data = closedPrData.items;
    githubData['open-issue'].data = openIssueData.items;
    githubData['closed-issue'].data = closedIssueData.items;
    setLoading(false);
    elements.forEach((item) => {
      createCards(item, 'All Repositories');
    });
  } catch (error) {
    displayError(error);
  }
}

initPage();

function setLoading(isLoad) {
  if (isLoad) {
    elements.forEach((element) => {
      githubData[element].element.innerHTML = loadingElement;
    });
  } else {
    let loaders = document.querySelectorAll('.loading-container');
    for (let i = 0; i < loaders.length; ++i) {
      loaders[i].remove();
    }
  }
}
async function fetchGithub(columnName) {
  const response = await fetch(githubData[columnName].apiUrl, {
    headers: {
      authorization: 'token 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',
    },
  });
  if (!response.ok) {
    const message = `The server responded with a status of ${response.status}`;
    throw new Error(message);
  }
  const cards = await response.json();
  return cards;
}

function displayError(message) {
  let loaders = document.querySelectorAll('.loading-container');
  for (let i = 0; i < loaders.length; ++i) {
    loaders[i].innerHTML = `<p>${message}</p>`;
  }
}
function createLabels(labels) {
  return `
	<div class="tag-container">
	${labels
    .map(
      (item) =>
        `<div class="tag" style="background: #${item.color}; color: ${
          lightOrDark(item.color) === 'dark' ? 'white' : 'black'
        }">${item.name}</div>`
    )
    .join('')}
	</div>
	`;
}
function constructCard(id, title, labels, posted, users, url) {
  return `<div class="card">
	<a href=${url} target="_blank">
	<p>#${id}</p><p>${title}</p>
	${labels.length > 0 ? createLabels(labels) : ''}
	<div class="card-footer">
	<i class="fa fa-comment"></i>
	<div class="card-users">${users}</div>
	<div class="card-time">${posted}</div>
	</div>
	</a>
	</div>`;
}
function createCards(columnName, repo) {
  if (repo !== 'All Repositories') {
    githubData[columnName].data = githubData[columnName].data.filter(
      (element) => {
        return element.repository_url.includes(repo);
      }
    );
  }
  let cardsString = ``;
  let cardCount = 0;
  githubData[columnName].data.forEach((element) => {
    let recentDate = new Date(element.created_at);
    const newDate =
      recentDate.getUTCDate() +
      '-' +
      recentDate.toLocaleString('default', { month: 'short' }) +
      '-' +
      recentDate.getUTCFullYear();
    const cardString = constructCard(
      element.number,
      element.title,
      element.labels,
      newDate,
      element.comments,
      element.html_url
    );
    cardsString += cardString;
    cardCount++;
  });
  githubData[columnName].element.innerHTML =
    githubData[columnName].element.innerHTML + cardsString;
  document.getElementById(
    `${columnName}-count`
  ).textContent = `${githubData[columnName].title} (${cardCount})`;
}

function createDatalist(data) {
  reposList = [];
  data.forEach((element) => {
    let optionElement = document.createElement('option');
    repoName = element.repository_url.substring(
      element.repository_url.lastIndexOf('/') + 1
    );
    optionElement.value = repoName;
    if (reposList.includes(repoName) === false) {
      repos.appendChild(optionElement);
      reposList.push(repoName);
    }
  });
}
function lightOrDark(color) {
  var r, g, b, hsp;
  if (color.match(/^rgb/)) {
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  if (hsp > 127.5) {
    return 'light';
  } else {
    return 'dark';
  }
}
function onInput() {
  let val = document.getElementById('input').value;
  let opts = document.getElementById('repos').childNodes;
  for (let i = 0; i < opts.length; i++) {
    if (opts[i].value === val) {
      createCards(globalData, val);
      break;
    }
  }
}
