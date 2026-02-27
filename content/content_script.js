async function copyMessageToClipboard() {
  const {
    reviewTemplate
  } = await chrome.storage.sync.get(['reviewTemplate']);
  const prLinkSymbol = /{PR_LINK}/;
  const prHeaderSymbol = /{PR_HEADER}/;
  const jiraLinkSymbol = /{JIRA_CARD}/;
  const jiraHeaderSymbol = /{JIRA_HEADER}/;
  const jiraLinks = [...document.querySelectorAll('a.jira-issue-link')];
  const jiraLinkPlainText = jiraLinks.map((link) => link.innerHTML).join('|');
  const jiraLinkHtmlText = jiraLinks.map((link) =>
    `<a href="${link.href}">${link.innerHTML}</a>`).join(' | ');
  const prHeader = document.querySelector('h1').textContent
    .split(jiraLinks[jiraLinks.length - 1]?.textContent ?? '')
    .pop()
    .replace(/^]/, '')
    .trim();
  const jiraHeader = document.querySelector('[data-testid="jira-issues-card-item"] > div')?.textContent ?? '';

  console.log({ prHeader, jiraHeader, jiraLinkPlainText, jiraLinkHtmlText });

  const clipboardItem = new ClipboardItem({
    "text/plain": new Blob(
      [
        reviewTemplate
          .replace(prLinkSymbol, 'PR')
          .replace(jiraLinkSymbol, jiraLinkPlainText)
          .replace(prHeaderSymbol, prHeader)
          .replace(jiraHeaderSymbol, jiraHeader)
      ], {
        type: "text/plain"
      }
    ),
    "text/html": new Blob(
      [
        reviewTemplate
          .replace(/\n/g, '<br>')
          .replace(prLinkSymbol, `<a href="${location.href}">PR</a>`)
          .replace(jiraLinkSymbol, jiraLinkHtmlText)
          .replace(jiraHeaderSymbol, jiraHeader)
          .replace(prHeaderSymbol, prHeader)
      ], {
        type: "text/html"
      }
    ),
  });

  return navigator.clipboard.write([clipboardItem]);
}

async function addCopyBtn() {
  if (!location.href.includes('pull-requests')) {
    return;
  }

  const btnClassName = 'pr-review-message__btn';
  const btnText = '📋 Copy review message';
  const currentCopyBtn = document.querySelector(`.${btnClassName}`);

  // Try Bitbucket selectors first
  let header1 = document.querySelector('[data-qa="pr-header-page-header-wrapper"] h1') || document.querySelector('[data-testid="pr-header"] h1');

  // If not found, try sourcecode.jnj.com selector
  if (!header1) {
    const headerSection = document.querySelector('div.pull-request-title-review-section');
    if (headerSection) {
      header1 = headerSection;
    }
  }

  if (header1 && !currentCopyBtn) {
    console.log('Adding copy button to PR page');
    const copyBtn = document.createElement('button');
    copyBtn.classList.add(btnClassName);
    copyBtn.textContent = btnText;

    copyBtn.addEventListener('click', async () => {
      await copyMessageToClipboard();

      copyBtn.textContent = '✅ Message copied!';
      copyBtn.setAttribute('disabled', '');

      setTimeout(() => {
        copyBtn.textContent = btnText;
        copyBtn.removeAttribute('disabled');
      }, 3000);
    });

    header1.insertAdjacentElement('afterend', copyBtn);
  } else {
    console.log('Copy button already exists or header not found');
  }
}

const observer = new MutationObserver((mutations) => {
  const isChildListChanged = mutations.some((mutation) =>
    mutation.type === 'childList' && mutation.addedNodes.length > 0
  );

  if (isChildListChanged) {
    observer.disconnect();

    addCopyBtn();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
