'use_script';

chrome.runtime.onMessage.addListener(function (request, sender) {
    console.log('background.js: received message', request);

    if (request.openBackgroundTab) {
        chrome.tabs.create({
            url: request.openBackgroundTab,
            index: sender.tab.index, // opens exactly before a the torrent's page tab
            active: false
        });
    } else {
        console.error('background.js: unknown message', request);
    }
});
