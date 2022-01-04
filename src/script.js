'use strict';

function runTpbHider(options) {
    const hiddenClass = 'dnthHidden';

    injectStyleString('.' + hiddenClass + ' { opacity: ' + options.hiddenOpacity + '; }');

    /**
     * Show/hide hidables in the view
     */
    const hidableView = {
        hide: function ($hidables, onComplete) {
            $hidables.addClass(hiddenClass);

            if (onComplete) {
                onComplete();
            }
        },
        show: function ($hidables, onComplete) {
            $hidables.removeClass(hiddenClass);

            if (onComplete) {
                onComplete();
            }
        },
        sortByVisibility: function () {
            $hidables.sortElements(function (hidable) {
                return $(hidable).hasClass(hiddenClass) ? 1 : -1;
            });
        }
    };

    const hidablesController = {
        showAll: function () {
            hidablesController.show($hidables);
        },
        hideAll: function () {
            hidablesController.hide($hidables);

            if (0 === options.hiddenOpacity) {
                window.scrollTo(0, 0);
            }
        },
        show: function ($hidables) {
            $hidables.each(function () {
                hiddenHidablesStorage.remove(identifyHidable($(this)));
            });

            hidableView.show($hidables);
        },
        hide: function ($hidables) {
            $hidables.each(function () {
                hiddenHidablesStorage.add(identifyHidable($(this)));
            });

            hidableView.hide($hidables);

            redirectToNextPageIfAllHidablesAreHidden();
        },
        toggleVisibility: function ($hidable) {
            if ($hidable.hasClass(hiddenClass)) {
                hidablesController.show($hidable);
            } else {
                hidablesController.hide($hidable);
            }
        }
    };

    /**
     * Gets hidable identifying data
     */
    const identifyHidable = function ($hidable) {
        try {
            const id = $hidable.find('.detName a').attr('href').match('/torrent/([0-9]+)/')[1];

            if (isNaN(id)) {
                throw 'ID should be a number'
            }

            return parseInt(id);
        } catch (e) {
            console.error('identifyHidable() identification error', $hidable, id);

            throw e;
        }
    };

    /**
     * Hidables IDs storage helper.
     * Keys have prefix to avoid collisions and easly find "out" items.
     * Key hold hidable IDs, values have the date they were hidden.
     */
    const hiddenHidablesStorage = new HidablesStorage(localStorage, 'dnthHiddenHidable_', options.gcDays);

    // hacked because they sometimes put 2 elements with the same ID (and put advertisement in the first one)
    const $searchResult = $('[id="searchResult"]:last');


    /**
     * Items to hide
     */
    const $hidables = $searchResult.find('tr:has(.detName)');

    const $nextPageButtons = $('a:has(img[alt="Next"])');

    /**
     * Clicking on a table row (hidable), hides it.
     */
    $hidables.click(function () {
        hidablesController.toggleVisibility($(this));
    });

    /**
     * Show all / hide all buttons after paginator
     */
    $('<a href="#" class="dnthBottomButton">' + chrome.i18n.getMessage('showAll') + '</a>')
        .click(function (e) {
            e.preventDefault();

            hidablesController.showAll();
        })
        .insertAfter($nextPageButtons);

    $('<a href="#" class="dnthBottomButton dnthHideAll">' + chrome.i18n.getMessage('hideAll') + '</a>')
        .click(function (e) {
            e.preventDefault();

            hidablesController.hideAll();
        })
        .insertAfter($nextPageButtons);

    function redirectToNextPageIfAllHidablesAreHidden() {
        const hidablesCount = $hidables.length;
        const visibleHidablesCount = $hidables.not('.' + hiddenClass).length;

        console.log('redirect?', hidablesCount, visibleHidablesCount);

        if (0 !== hidablesCount && 0 === visibleHidablesCount) {
            console.log('no visible items, redirecting to next page');

            $nextPageButtons[0].click();
        }
    }

    /**
     * Page loaded: hiding elements already hidden and saved to localStorage
     */
    hidableView.hide($hidables.filter(function () {
        return hiddenHidablesStorage.has(identifyHidable($(this)));
    }), redirectToNextPageIfAllHidablesAreHidden);


    /**
     * Sorting by visibility
     * and cloning paginator before first invisible hidable.
     */
    if (options.visibleFirst && options.hiddenOpacity > 0) {
        hidableView.sortByVisibility();

        if ($searchResult.has($nextPageButtons).length) {
            // tpb category page, paginator is as a torrents list table row
            $nextPageButtons
                .parent()
                .clone(true)
                .insertBefore($searchResult.find('tr.' + hiddenClass + ':first'));
        } else {
            // search page, paginator is under the torrents list table
            $('<td colspan="9"></td>')
                .insertBefore($searchResult.find('tr.' + hiddenClass + ':first'))
                .prepend($nextPageButtons.parent())
                .clone(true)
                .insertAfter($searchResult.find('tr:last'));
        }
    }

    openImdbLinkInBackground();
}
