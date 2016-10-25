chrome.tabs.onActivated.addListener(function(tab) {
	chrome.pageAction.show(tab.id);
});