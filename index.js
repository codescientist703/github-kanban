const openPr = document.getElementById('open-pr');
const closedPr = document.getElementById('closed-pr');
const openIssue = document.getElementById('open-issue');
const closedIssue = document.getElementById('closed-issue');
let username;
let globalData = [];
let repo = 'All Repositories';

const elements = ['open-pr', 'closed-pr', 'open-issue', 'closed-issue'];
const loadingElement = `<div class="loading-container">
<div class="loading" ></div></div>`;

// Checking param in URL
const params = new URLSearchParams(window.location.search);
if (params.has('user')) {
  username = params.get('user');
} else {
  username = config.user;
}
const repoUrl = `https://api.github.com/users/${username}/repos?type=owner`;

let githubData = {
  'open-pr': {
    element: openPr,
    title: 'Open Pull Requests',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Apr+author%3A${username}+archived%3Afalse+is%3Aopen`,
    page: 1,
    total: 0,
    cur: 0,
  },
  'closed-pr': {
    element: closedPr,
    title: 'Closed Pull Requests',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Apr+author%3A${username}+archived%3Afalse+is%3Aclosed`,
    page: 1,
    total: 0,
    cur: 0,
  },
  'open-issue': {
    element: openIssue,
    title: 'Open Issues',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Aissue+author%3A${username}+archived%3Afalse+is%3Aopen`,
    page: 1,
    total: 0,
    cur: 0,
  },
  'closed-issue': {
    element: closedIssue,
    title: 'Closed Issues',
    data: [],
    apiUrl: `https://api.github.com/search/issues?q=is%3Aissue+author%3A${username}+archived%3Afalse+is%3Aclosed`,
    page: 1,
    total: 0,
    cur: 0,
  },
};

async function initPage() {
  setLoading(true);
  try {
    let [openPrData, closedPrData, openIssueData, closedIssueData] =
      await Promise.all(elements.map((data) => fetchGithub(createUrl(data))));

    githubData['open-pr'].data = openPrData.items;
    githubData['open-pr'].total = openPrData.total_count;
    githubData['open-pr'].cur = openPrData.items.length;

    githubData['closed-pr'].data = closedPrData.items;
    githubData['closed-pr'].total = closedPrData.total_count;
    githubData['closed-pr'].cur = closedPrData.items.length;

    githubData['open-issue'].data = openIssueData.items;
    githubData['open-issue'].total = openIssueData.total_count;
    githubData['open-issue'].cur = openIssueData.items.length;

    githubData['closed-issue'].data = closedIssueData.items;
    githubData['closed-issue'].total = closedIssueData.total_count;
    githubData['closed-issue'].cur = closedIssueData.items.length;

    setLoading(false);
    elements.forEach((item) => {
      createCards(item);
      githubData[item].page++;
    });
  } catch (error) {
    displayError(error);
  }
}
async function updatePage(columnName) {
  try {
    const response = await fetchGithub(createUrl(columnName));
    githubData[columnName].data = response.items;
    githubData[columnName].cur += response.items.length;
    createCards(columnName);
    githubData[columnName].page++;
  } catch (error) {
    console.log(error);
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

function createUrl(columnName) {
  if (columnName === 'repo') {
    return repoUrl;
  }
  let url = githubData[columnName].apiUrl;
  if (repo !== 'All Repositories' && repo !== '') {
    url += `+repo%3A${repo}`;
  }
  url += `&page=${githubData[columnName].page}`;
  return url;
}

async function fetchGithub(url) {
  let mainHeader = {};
  if ('token' in config) {
    if (config.token !== '') {
      mainHeader = {
        authorization: `token ${config.token}`,
      };
    }
  }
  const response = await fetch(url, {
    headers: mainHeader,
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

function createCards(columnName) {
  let cardsString = ``;
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
  });
  if (githubData[columnName].cur !== githubData[columnName].total) {
    cardsString += `<div style='margin: 0.5rem'>
		<button class='btn' id='${columnName}-load'>Load more</button><div>`;
  }
  if (githubData[columnName].page > 1) {
    let d_nested = document.getElementById(`${columnName}-load`);
    d_nested.remove();
  }

  githubData[columnName].element.innerHTML =
    githubData[columnName].element.innerHTML + cardsString;
  document.getElementById(
    `${columnName}-count`
  ).textContent = `${githubData[columnName].title} (${githubData[columnName].total})`;
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

//Event Handlers

document.addEventListener('click', function (e) {
  if (e.target.innerText === 'Load more') {
    const columnName = e.target.id.replace('-load', '');
    document.getElementById(e.target.id).textContent = 'Loading...';
    updatePage(columnName);
  } else if (e.target.innerText === 'Submit') {
    const value = document.getElementById('input').value;
    repo = value;
    elements.forEach((item) => {
      githubData[item].page = 1;
    });
    initPage();
  }
});

document.querySelector('.main-title').addEventListener('click', function () {
  location.reload();
});
