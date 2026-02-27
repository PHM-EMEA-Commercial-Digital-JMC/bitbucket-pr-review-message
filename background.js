chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install") {
    const defaultReviewTemplate = `{PR_LINK} for {JIRA_CARD}

Please review! 🙏`;
    chrome.storage.sync.set({ reviewTemplate: defaultReviewTemplate });
  }
  else if (details.reason == "update") {
    chrome.action.setBadgeText({ text: 'NEW' });
  }
});