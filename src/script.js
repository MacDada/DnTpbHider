'use_script';

(function (options) {
    var injectStyleString = function (str) {
        var node = document.createElement('style');
        node.innerHTML = str;
        document.body.appendChild(node);
    };

    var hiddenClass = 'dnthHidden';

    injectStyleString('.' + hiddenClass + ' { opacity: ' + options.hiddenOpacity + '; }');

    /**
     * Show/hide hidables in the view
     */
    var hidableView = {
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

    var hidablesController = {
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

    var HidablesStorage = function (storageDriver, prefix) {
        var countKey = "_" + prefix + "_count";

        this.has = function (id) {
            if (!id) {
                return false;
            }

            return storageDriver[prefix + id] ? true : false;
        };

        this.add = function (id) {
            if (!id) {
                return false;
            }

            if (!this.has(id)) {
                storageDriver[countKey]++;
            }

            storageDriver[prefix + id] = (new Date()).toJSON();

            return true;
        };

        this.remove = function (id) {
            if (!id) {
                return false;
            }

            if (this.has(id)) {
                storageDriver.removeItem(prefix + id);
                storageDriver[countKey]--;

                return true;
            }

            return false;
        };

        this.removeOlderThan = function (date) {
            console.log('dnth removeOlderThan', date);

            var beforeCount = storageDriver[countKey];

            // deleting all storage hidables that are older then "date" arg.
            // takes only dnth keys into account (filters thx to the prefix)
            for (var key in storageDriver) {
                if (0 === key.indexOf(prefix)     // has the prefix
                    && new Date(storageDriver[key]) < date // is old enough
                ) {
                    console.log("dnth removing ", key);

                    storageDriver.removeItem(key);
                    storageDriver[countKey]--;
                }
            }

            return beforeCount - storageDriver[countKey];
        };

        this.count = function () {
            return parseInt(storageDriver[countKey]);
        };

        this.clear = function () {
            return this.removeOlderThan(new Date());
        };

        // init count
        if (!storageDriver[countKey]) {
            storageDriver[countKey] = 0;
        }

        // gc: automatically delete old hidables
        (function (storage) {
            var date = new Date();
            date.setDate(date.getDate() - options.gcDays);

            console.log('dnth gc: removed '
                + storage.removeOlderThan(date)
                + ' hidables older than '
                + date
            );
        })(this);
    }; // eo Storage

    /**
     * Gets hidable identifying data
     */
    var identifyHidable = function ($hidable) {
        try {
            var id = $hidable.find('.detName a').attr('href').match('/torrent/([0-9]+)/')[1];

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
    var hiddenHidablesStorage = new HidablesStorage(localStorage, 'dnthHiddenHidable_');


    var $searchResult = $('#searchResult');


    /**
     * Items to hide
     */
    var $hidables = $searchResult.find('tr:has(.detName)');

    var $nextPageButtons = $('a:has(img[alt="Next"])');

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
        if (0 !== $hidables.length && 0 === $hidables.not('.' + hiddenClass).length) {
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

    /**
     * Open IMDB link in a background tab
     */
    var $imdbLink = $('#details').find('.nfo pre a[href*="imdb.com/title/"]');
    if ($imdbLink.length) {
        console.log('script.js: asking for tab', $imdbLink.attr('href'));

        chrome.runtime.sendMessage({openBackgroundTab: $imdbLink.attr('href')});
    }

})({hiddenOpacity: 0.2, visibleFirst: true, gcDays: 30});
