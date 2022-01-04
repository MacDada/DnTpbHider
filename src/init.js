'use strict';

$('#content').prepend((function () {
    const isDisabled = localStorage['dnthDisabled'];

    const $button = $('<a href="#"></a>')
        .text(isDisabled ? 'Włącz DnTpbHider' : 'Wyłącz DnTpbHider')
        .click(function () {
            if (isDisabled) {
                localStorage.removeItem('dnthDisabled');
            } else {
                localStorage['dnthDisabled'] = 'true';
            }

            window.location.reload();
        });

    if (!isDisabled) {
        runTpbHider({
            hiddenOpacity: 0.2,
            visibleFirst: true,
            gcDays: 30
        });
    }

    return $button;
})());
