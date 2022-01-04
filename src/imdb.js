/**
 * Open IMDB link in a background tab
 */
function openImdbLinkInBackground() {
    const $movieTitle = $('#title');

    if ($movieTitle.length) {
        function filterTitle(title) {
            return title
                .replace(/\./gi, ' ')
                .replace(/1080p/gi, ' ')
                .replace(/720p/gi, ' ')
                .replace(/hd/gi, ' ')
                .replace(/X264/gi, ' ')
                .replace(/h264/gi, ' ')
                .replace(/h 264/gi, ' ')
                .replace(/DDP5/gi, ' ')
                .replace(/EVO/gi, ' ')
                .replace(/WEB-DL/gi, ' ')
                .replace(/TGx/gi, ' ')
                .replace(/GalaxyRG/gi, ' ')
                .replace(/DD5/gi, ' ')
                .replace(/WEBRip/gi, ' ')
                .replace(/AMZN/gi, ' ')
                .replace(/PDVDRip/gi, ' ')
                .replace(/rip/gi, ' ')
                .replace(/HINDI/gi, ' ')
                .replace(/DUB/gi, ' ')
                .replace(/REPACK/gi, ' ')
                .replace(/HDCAM/gi, ' ')
                .replace(/C1NEM4/gi, ' ')
                .replace(/2160p/gi, ' ')
                .replace(/HEVC/gi, ' ');
        }

        const imdbSearchLink = 'https://duckduckgo.com/?q=!ducky+' + encodeURIComponent('imdb ' + filterTitle($movieTitle.text()));

        console.log('script.js: asking for tab', imdbSearchLink, filterTitle($movieTitle.text()));

        chrome.runtime.sendMessage({openBackgroundTab: imdbSearchLink});
    }
}
