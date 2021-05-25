const openPr = document.getElementById('open-pr');
const closedPr = document.getElementById('closed-pr');
const openIssue = document.getElementById('open-issue');
const closedIssue = document.getElementById('closed-issue');
const repos = document.getElementById('repos');
let globalData = [];
fetchGithub()
  .then((data) => {
    globalData = data.items;
    createCards(data.items, 'All Repositories');
    createDatalist(data.items);
  })
  .catch((error) => {
    console.log(error);
    displayError(error);
  });

async function fetchGithub() {
  const response = await fetch(
    `https://api.github.com/search/issues?q=author%3A${config.user}+archived%3Afalse`
  );
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
function createCards(data, repo) {
  if (repo !== 'All Repositories') {
    data = data.filter((element) => {
      return element.repository_url.includes(repo);
    });
  }
  let prOpenCardsString = ``;
  let prClosedCardsString = ``;
  let issueClosedCardsString = ``;
  let issueOpenCardsString = ``;
  let openPrCount = 0;
  let closedPrCount = 0;
  let openIssueCount = 0;
  let closedIssueCount = 0;
  data.forEach((element) => {
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
    if (element.html_url.includes('issues')) {
      if (element.state === 'open') {
        issueOpenCardsString += cardString;
        openIssueCount++;
      } else {
        issueClosedCardsString += cardString;
        closedIssueCount++;
      }
    } else {
      if (element.state === 'open') {
        prOpenCardsString += cardString;
        openPrCount++;
      } else {
        prClosedCardsString += cardString;
        closedPrCount++;
      }
    }
  });
  openPr.innerHTML = prOpenCardsString;
  closedPr.innerHTML = prClosedCardsString;
  openIssue.innerHTML = issueOpenCardsString;
  closedIssue.innerHTML = issueClosedCardsString;
  document.getElementById(
    'open-pr-count'
  ).textContent = `Open Pull Requests (${openPrCount})`;
  document.getElementById(
    'closed-pr-count'
  ).textContent = `Closed Pull Requests (${closedPrCount})`;
  document.getElementById(
    'open-issue-count'
  ).textContent = `Open Issues (${openIssueCount})`;
  document.getElementById(
    'closed-issue-count'
  ).textContent = `Closed Issues (${closedIssueCount})`;
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
