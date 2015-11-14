(function(options) {
    var injectStyleString = function(str) {
        var node = document.createElement('style');
        node.innerHTML = str;
        document.body.appendChild(node);
    };

    var hiddenClass = 'dnthHidden';

    injectStyleString('.' + hiddenClass + ' { opacity: ' + options.hiddenOpacity + '; }');

    /**
     * Show/hide hidables in the view
     */
    var hidableViewFunctions = {
        hide: function($el) {
            $el.addClass(hiddenClass);
        },
        show: function($el) {
            $el.removeClass(hiddenClass);
        }
    };


    var HidablesStorage = function(storageDriver, prefix) {
        var countKey = "_" + prefix + "_count";

        this.has = function(id) {
            if (!id) {
                return false;
            }

            return storageDriver[prefix + id] ? true : false;
        };

        this.add = function(id) {
            if (!id) {
                return false;
            }

            if (!this.has(id)) {
                storageDriver[countKey]++;
            }

            storageDriver[prefix + id] = (new Date()).toJSON();

            return true;
        };

        this.remove = function(id) {
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

        this.removeOlderThan = function(date) {
            console.log('dnth removeOlderThan', date);

            var beforeCount = storageDriver[countKey];

            // deleting all storage hidables that are older then "date" arg.
            // takes only dnth keys into account (filters thx to the prefix)
            for (var key in storageDriver) {
                if (   0 === key.indexOf(prefix)     // has the prefix
                    && new Date(storageDriver[key]) < date // is old enough
                ) {
                    console.log("dnth removing ", key);

                    storageDriver.removeItem(key);
                    storageDriver[countKey]--;
                }
            }

            return beforeCount - storageDriver[countKey];
        };

        this.count = function() {
            return parseInt(storageDriver[countKey]);
        };

        this.clear = function() {
            return this.removeOlderThan(new Date());
        };

        // init count
        if (!storageDriver[countKey]) {
            storageDriver[countKey] = 0;
        }

        // gc: automatically delete old hidables
        (function(storage) {
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
    var identifyHidable = function($hidable) {
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

    var $nextPageButton = $('a:has(img[alt="Next"])');

    /**
     * Clicking on a table row (hidable), hides it.
     */
    $hidables.click(function() {
        var $hidable = $(this);

        if ($hidable.hasClass(hiddenClass)) {
            // pokazujemy artykuł
            hidableViewFunctions.show($hidable);
            hiddenHidablesStorage.remove(identifyHidable($hidable));
        } else {
            // ukrywamy artykuł
            hidableViewFunctions.hide($hidable);
            hiddenHidablesStorage.add(identifyHidable($hidable));
        }
    });


    /**
     * Show all / hide all buttons after paginator
     */
    $('<a href="#" class="dnthBottomButton">' + chrome.i18n.getMessage('showAll') + '</a>')
        .click(function(e) {
            e.preventDefault();

            hidableViewFunctions.show($hidables);

            $hidables.each(function() {
                hiddenHidablesStorage.remove(identifyHidable($(this)));
            });
        })
        .insertAfter($nextPageButton);

    $('<a href="#" class="dnthBottomButton dnthHideAll">' + chrome.i18n.getMessage('hideAll') + '</a>')
        .click(function(e) {
            e.preventDefault();

            hidableViewFunctions.hide($hidables);

            if (0 === options.hiddenOpacity) {
                window.scrollTo(0, 0);
            }

            $hidables.each(function() {
                hiddenHidablesStorage.add(identifyHidable($(this)));
            });
        })
        .insertAfter($nextPageButton);


    /**
     * Page loaded: hiding elements already hidden and saved to localStorage
     */
    hidableViewFunctions.hide($hidables.filter(function() {
        return hiddenHidablesStorage.has(identifyHidable($(this)));
    }));


    /**
     * Sorting by visibility
     * and cloning paginator before first invisible hidable.
     */
    if (options.visibleFirst && options.hiddenOpacity > 0) {
        $hidables.sortElements(function(a, b) {
            return $(a).hasClass(hiddenClass) ? 1 : -1;
        });

        if ($searchResult.has($nextPageButton).length) {
            // tpb category page, paginator is as a torrents list table row
            $nextPageButton
                .parent()
                .clone(true)
                .insertBefore(
                    $searchResult.find('tr.' + hiddenClass + ':first')
                );
        } else {
            // search page, paginator is under the torrents list table
            $('<td colspan="9"></td>')
                .insertBefore(
                    $searchResult.find('tr.' + hiddenClass + ':first')
                )
                .prepend(
                    $nextPageButton.parent()
                )
                .clone(true)
                .insertAfter(
                    $searchResult.find('tr:last')
                );
        }
    }

    /**
     * Open IMDB link in a background tab
     */
    var $imdbLink = $('#details .nfo pre a[href*="imdb.com/title/"]');
    if (null !== $imdbLink) {
        console.log('script.js: asking for tab', $imdbLink.attr('href'));

        chrome.runtime.sendMessage({ openBackgroundTab: $imdbLink.attr('href') });
    }

})({ hiddenOpacity: 0.2, visibleFirst: true, gcDays: 30 });
