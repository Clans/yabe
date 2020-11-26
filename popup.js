const openBookmarksLimit = 8;

var bkg = chrome.extension.getBackgroundPage();
var bookmarks = [];
var localStorage = window.localStorage;
var $body = $(document.body);
var $tree = $('#tree1');

var $cover = $('#cover');
var $editDialog = $('#edit-dialog');
var $editSubmit = $('#edit-dialog-submit');
var $editCancel = $('#edit-dialog-cancel');
var $confirmDialog = $('#confirm-dialog');
var $confirmSubmit = $('#confirm-dialog-submit');
var $confirmCancel = $('#confirm-dialog-cancel');

var os = (navigator.platform.toLowerCase().match(/mac|win|linux/i) || ['other'])[0];

const testData = [
    {
        title: 'Folder 1',
        id: 1,
        parentId: 0,
        children: [
            {
                title: 'Folder 1',
                id: 111,
                parentId: 1,
                children: [
                    {
                        title: 'Bookmark 1',
                        id: 1111,
                        url: "https://example.com",
                        parentId: 111
                    },
                    {
                        title: 'Bookmark 2',
                        id: 1112,
                        url: "https://example.com",
                        parentId: 111
                    },
                    {
                        title: 'Bookmark 3',
                        id: 1113,
                        url: "https://example.com",
                        parentId: 111
                    },
                    {
                        title: 'Bookmark 4',
                        id: 1114,
                        url: "https://example.com",
                        parentId: 111
                    }
                ]
            },
            {
                title: 'Folder 2',
                id: 112,
                parentId: 1,
                children: [
                    {
                        title: 'Bookmark 1',
                        id: 1121,
                        url: "https://example.com",
                        parentId: 112
                    },
                    {
                        title: 'Bookmark 2',
                        id: 1122,
                        url: "https://example.com",
                        parentId: 112
                    }
                ]
            },
            {
                title: 'Folder 3',
                id: 113,
                parentId: 1,
                children: [
                    {
                        title: 'Bookmark 1',
                        id: 1131,
                        url: "https://example.com",
                        parentId: 113
                    },
                    {
                        title: 'Bookmark 2',
                        id: 1132,
                        url: "https://example.com",
                        parentId: 113
                    }
                ]
            },
            {
                title: 'Bookmark 1',
                id: 114,
                url: "https://example.com",
                parentId: 1
            },
            {
                title: 'Bookmark 2',
                id: 115,
                url: "https://example.com",
                parentId: 1
            },
            {
                title: 'Bookmark 3',
                id: 116,
                url: "https://example.com",
                parentId: 1
            }
        ]
    },
    {
        title: 'Folder 2',
        id: 21,
        parentId: 0,
        children: [
            {
                title: 'Bookmark 1',
                id: 311,
                url: "https://example.com",
                parentId: 21
            }
        ]
    },
    {
        title: 'Folder 3',
        id: 31,
        parentId: 0,
        children: [
            {
                title: 'Bookmark 1',
                id: 311,
                url: "https://example.com",
                parentId: 31
            }
        ]
    }
];

(function (window) {    
    // disable middle mouse click scrolling
    $('body').mousedown((event) => {
        if (event.button === 1) {
            event.preventDefault();
            return false;
        }
    });

    $tree.on('tree.click', (event) => {
        event.preventDefault();
        var node = event.node;
        if (isFolder(node)) {
            $tree.tree('toggle', node);
        } else {
            chrome.tabs.create({ url: node.url, active: !isBackgroundTab(event.click_event.originalEvent) });
        }
    });

    $tree.on('tree.open', (event) => {
        if (!$tree.tree('isDragging')) {
            closeOpenNodes(event.node);
            $tree.tree('scrollToNode', event.node)
        }
        $tree.tree('addToSelection', event.node, false);
    });

    $tree.on('tree.close', (event) => {
        $tree.tree('removeFromSelection', event.node);
        closeOpenChildNodes(event.node.children);
    });

    $tree.on('auxclick', (event) => {
        if (event.button === 1) {
            const node = $tree.tree('getNodeByHtmlElement', event.target);

            if (node && !isFolder(node)) {
                chrome.tabs.create({ url: node.url, active: false });
            }
        }
    });

    window.addEventListener('scroll', () => {
        localStorage.scrollTop = $(window).scrollTop();
    });

    loadBookmarks();

    if (os == 'mac') {
        $editCancel.css({
            order: 0
        });

        $confirmCancel.css({
            order: 0
        });
    }

    function isBackgroundTab(event) {
        return (event.metaKey && event.button == 0) || (event.ctrlKey && event.button == 0);
    }

    function loadBookmarks() {
        chrome.bookmarks.getTree(function (tree) {
            var data = tree[0].children;
            displayBookmarks(data);
        });
    }

    function isFolder(node) {
        return node.dateGroupModified || typeof node.url == 'undefined';
    }

    function displayBookmarks(bookmarks) {
        $tree.tree({
            data: bookmarks,
            // dragAndDrop: true,
            saveState: true,
            selectable: false,
            closedIcon: $('<object class="folder-plus" data="images/folder-plus.svg" width="16" height="16"></object>'),
            openedIcon: $('<object class="folder-plus" data="images/folder-minus.svg" width="16" height="16" ></object>'),
            onCreateLi: function (node, $li, is_selected) {
                var title = node.name;
                if (!isFolder(node)) {
                    if (!node.name || !node.name.trim()) { 
                        $li.find('.jqtree-title').text(node.url); 
                    }
                    var favicon = 'chrome://favicon/size/16@2x/' + node.url;
                    setTimeout(() => {
                        $li.find('.jqtree-title').before('<div id="favicon" class="favicon">');
                        $li.find('#favicon').css({
                            background: 'url(' + favicon + ') center no-repeat',
                            'background-size': 'contain'
                        });
                    }, 100);
                    title += node.name ? ('\n\n' + node.url) : node.url;
                } else if (isFolder(node) && node.children.length == 0) {
                    $li.find('.jqtree-title')
                        .before('<object class="folder-empty" data="images/folder-empty.svg" width="16" height="16"></object>');
                }
                $li.find('.jqtree-title').attr({ 'title': title });
            },
            onCanMove: function (node) {
                return node.parent.parent;
            },
            onCanMoveTo: function (moved_node, target_node, position) {
                if (isFolder(target_node)) {
                    return position == 'inside';
                } else {
                    return position == 'after';
                }
            },
            onIsMoveHandle: function ($element) {
                // TODO: add custom UI element to handle drag'n'drop
                // Only dom elements with 'jqtree-title' class can be used
                // as move handle.
                return ($element.is('.jqtree-title'));
            }
        });

        var menu = $tree.jqTreeContextMenu((node) => {
            return isFolder(node) ? $('#menu-folder') : $('#menu-bookmark');
        }, {
            "new_window": (node) => { openBookmarkInNewWindow(node.url, false); },
            "incognito_window": (node) => { openBookmarkInNewWindow(node.url, true); },
            "edit": (node) => { showEditNodeDialog(node); },
            "delete": (node) => {
                if (isFolder(node) && node.children.length > 0) {
                    var html = 'Folder <b>"' + node.name + '"</b> contains <b>' + node.children.length + '</b> item(s). Are you sure you want to delete?';
                    showConfirmDialog(html, () => {
                        removeTree(node);
                    });
                } else {
                    removeNode(node);
                }
            },
            "open_all": (node) => { openBookmarksFolder(node); },
            "open_all_new_window": (node) => { openBookmarksFolder(node, true, false); },
            "open_all_incognito_window": (node) => { openBookmarksFolder(node, true, true); }
        });

        menu.disable('Bookmarks Bar', ['edit', 'delete']);
        menu.disable('Other Bookmarks', ['edit', 'delete']);
        menu.disable('Mobile Bookmarks', ['edit', 'delete']);

        restoreScrollPosition();
    }

    function restoreScrollPosition() {
        $('html,body').scrollTop(localStorage.scrollTop);
    }

    function closeOpenNodes(toggleNode) {
        var openNodes = $tree.tree('getSelectedNodes');
        for (var i = 0; i < openNodes.length; i++) {
            var openNode = openNodes[i];
            if (toggleNode.id != openNode.id && toggleNode.parentId == openNode.parentId) {
                $tree.tree('closeNode', openNode, false);
                $tree.tree('removeFromSelection', openNode);
            }

            if (toggleNode.id == openNode.id) {
                $tree.tree('removeFromSelection', openNode);
                closeOpenChildNodes(openNode.children);
            }
        }
    }

    function closeOpenChildNodes(children) {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.is_open) {
                $tree.tree('closeNode', child, false);
                $tree.tree('removeFromSelection', child);
                if (child.children) {
                    closeOpenChildNodes(child.children);
                }
            }
        }
    }

    function showEditNodeDialog(node) {
        var dialogTitle;
        if (isFolder(node)) {
            dialogTitle = 'Edit Folder';
            $('#url').hide();
        } else {
            dialogTitle = 'Edit Bookmark';
            $('#url').val(node.url);
            $('#url').show();
        }
        $('#edit-title').text(dialogTitle);
        $('#title').val(node.name);
        $('#error').hide();
        $('#url').removeClass('input-error');

        $body.addClass('edit-background');
        $editDialog
            .fadeIn(200)
            .css({
                top: '-150px'
            })
            .animate({
                top: 0
            }, 150);
        $cover
            .delay(100)
            .fadeIn(250)
            .css({
                left: 0
            });

        disableScroll();

        $body.bind('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                hideEditNodeDialog();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                $editSubmit.click();
            }
        });

        $editSubmit.on('click', (e) => {
            e.preventDefault();
            node.name = $('#title').val();
            if (!isFolder(node)) {
                node.url = $('#url').val();
            }
            if (isFolder(node)) {
                saveEdits(node);
            } else if (isUrlValid(node.url)) {
                saveEdits(node);
            } else {
                $('#error').fadeIn(100);
                $('#url').focus();
                $('#url').addClass('input-error');
                $('#url').on('change paste keyup', () => {
                    $('#url').removeClass('input-error');
                    $('#error').hide();
                });
            }
        });

        $editCancel.on('click', (e) => {
            e.preventDefault();
            hideEditNodeDialog();
        });

        $cover.on('click', () => { hideEditNodeDialog(); });
    }

    function hideEditNodeDialog() {
        $cover
            .fadeOut(100)
            .css({
                left: '-100%'
            });
        $editDialog
            .animate({
                top: '-100%'
            }, 150, () => { $body.removeClass('edit-background'); })
            .fadeOut(100);

        enableScroll();

        $body.unbind('keydown');
        $editSubmit.unbind('click');
        $editCancel.unbind('click');
        $cover.unbind('click');
    }

    function showConfirmDialog(html, callback) {
        $('#confirm-dialog-text').html(html);
        $body.addClass('confirm-background');

        $confirmDialog
            .fadeIn(200)
            .css({
                top: '-150px'
            })
            .animate({
                top: 0
            }, 150);
        $cover
            .delay(100)
            .fadeIn(250)
            .css({
                left: 0
            });

        disableScroll();

        $body.bind('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                hideConfirmDialog();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                $confirmSubmit.click();
            }
        });

        $confirmSubmit.on('click', (e) => {
            e.preventDefault();
            hideConfirmDialog()
            callback();
        });

        $confirmCancel.on('click', (e) => {
            e.preventDefault();
            hideConfirmDialog();
        });

        $cover.on('click', () => { hideConfirmDialog(); });
    }

    function hideConfirmDialog() {
        $cover
            .fadeOut(100)
            .css({
                left: '-100%'
            });
        $confirmDialog
            .animate({
                top: '-100%'
            }, 150, () => { $body.removeClass('confirm-background'); })
            .fadeOut(100);

        enableScroll();

        $body.unbind('keydown');
        $confirmSubmit.unbind('click');
        $confirmCancel.unbind('click');
        $cover.unbind('click');
    }

    function disableScroll() {
        // Get the current page scroll position 
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,

            // if any scroll is attempted, set this to the previous value 
            window.onscroll = function () {
                window.scrollTo(scrollLeft, scrollTop);
            };
        $body.addClass('hide-scrollbar');
    }

    function enableScroll() {
        window.onscroll = function () { };
        $body.removeClass('hide-scrollbar');
    }

    function saveEdits(node) {
        hideEditNodeDialog();

        chrome.bookmarks.update(node.id, { title: node.name, url: node.url }, (result) => {
            $tree.tree('updateNode', node, {
                id: result.id,
                name: result.title,
                url: result.url
            });
        });
    }

    function removeNode(node) {
        chrome.bookmarks.remove(node.id, () => {
            $tree.tree('removeNode', node);
            restoreScrollPosition();
        });
    }

    function removeTree(node) {
        chrome.bookmarks.removeTree(node.id, () => {
            $tree.tree('removeNode', node);
        });
    }

    function openBookmarkInNewWindow(url, incognito) {
        chrome.windows.create({
            url: url,
            incognito: incognito
        });
    }

    function openBookmarksFolder(folder, newWindow, incognito) {
        chrome.bookmarks.getChildren(folder.id, (children) => {
            var urls = children
                .filter(child => typeof child.url != 'undefined')
                .map(child => child.url);

            if (urls.length > openBookmarksLimit) {
                var html = "Are you sure you want to open all <b>" + urls.length + "</b>"
                    + (newWindow ?
                        incognito
                            ? " bookmarks in a new incognito window"
                            : " bookmarks in a new window?"
                        : " bookmarks?");
                showConfirmDialog(html, () => {
                    newWindow
                        ? openBookmarksFolderNewWindowConfirmed(urls, incognito)
                        : openBookmarksFolderConfirmed(urls);
                });
            } else {
                newWindow
                    ? openBookmarksFolderNewWindowConfirmed(urls, incognito)
                    : openBookmarksFolderConfirmed(urls);
            }

        });
    }

    function openBookmarksFolderConfirmed(urls) {
        for (var i = 0; i < urls.length; i++) {
            chrome.tabs.create({
                url: urls[i],
                selected: i == 0
            });
        }
    }

    function openBookmarksFolderNewWindowConfirmed(urls, incognito) {
        chrome.windows.create({
            url: urls,
            incognito: incognito
        });
    }

    function isUrlValid(url) {
        return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
    }
})(window);