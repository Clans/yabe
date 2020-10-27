var bkg = chrome.extension.getBackgroundPage();
var bookmarks = [];
var $tree = $('#tree1');
var $bookmarkContextMenu = $('bookmark-context-menu');

window.addEventListener('load', init, false);

function init() {
    // disable middle mouse click scrolling
    $('body').mousedown((event) => { 
        if (event.button === 1) {
            event.preventDefault();
            return false;
        }
    });

    $tree.on(
        'tree.click',
        function(event) {
            event.preventDefault();
            var node = event.node;
            if (isFolder(node)) {
                $tree.tree('toggle', node);
            } else {
                chrome.tabs.create({url: node.url, active: !isBackgroundTab(event.click_event.originalEvent)});
            }
        }
    );
    
    $tree.on(
        'tree.open',
        function(e) {
            if (!$tree.tree('isDragging')) {
                closeOpenNodes(e.node);
                resetHeight(() => {$tree.tree('scrollToNode', e.node)});
            }
            $tree.tree('addToSelection', e.node, false);
        }
    );
    
    $tree.on(
        'tree.close',
        function(e) {
            $tree.tree('removeFromSelection', e.node);
            closeOpenChildNodes(e.node.children);
            resetHeight();
        }
    );

    $tree.on("auxclick", (event) => {
        if (event.button === 1) {
            const node = $tree.tree("getNodeByHtmlElement", event.target);
    
            if (node && !isFolder(node)) {
                chrome.tabs.create({url: node.url, active: false});
            }
        }
    });

    // var menu = $tree.jqTreeContextMenu((node) => {
    //     return isFolder(node) ? $('#menu-folder') : $('#menu-bookmark');
    // }, {
    //     "edit": function (node) { alert('Edit node: ' + node.name); },
    //     "delete": function (node) { alert('Delete node: ' + node.name); },
    //     "add": function (node) { alert('Add node: ' + node.name); }
    // });

    // menu.disable('Bookmarks Bar', ['edit', 'delete']);
    // menu.disable('Other Bookmarks', ['edit', 'delete']);
    // menu.disable('Mobile Bookmarks', ['edit', 'delete']);

    loadBookmarks();
}

function isBackgroundTab(event) {
    return (event.metaKey && event.button == 0) || (event.ctrlKey && event.button == 0);
}

function loadBookmarks() {
    var testData = [
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

    chrome.bookmarks.getTree(function(tree) {
        var data = tree[0].children;
        displayBookmarks(data);
    });
}

function isFolder(node) {
    return typeof node.url == 'undefined';
}

function displayBookmarks(bookmarks) {
    $tree.tree({
        data: bookmarks,
        // dragAndDrop: true,
        selectable: false,
        closedIcon: $('<i class="fas fa-folder-plus"></i>'),
        openedIcon: $('<i class="fas fa-folder-minus"></i>'),
        onCreateLi: function(node, $li, is_selected) {
            var title = node.name;
            if (!isFolder(node)) {
                var favicon = 'chrome://favicon/size/16@2x/' + node.url;
                $li.find('.jqtree-title').before('<img class="favicon" src="' + favicon + '" width="16" height="16" alt="">');
                title += '\n\n' + node.url;
            }
            $li.find('.jqtree-title').attr({'title': title});
        },
        onCanMove: function(node) {
            return node.parent.parent;
        },
        onCanMoveTo: function(moved_node, target_node, position) {
            if (isFolder(target_node)) {
                return position == 'inside';
            } else {
                return position == 'after';
            }
        },
        onIsMoveHandle: function($element) {
            // TODO: add custom UI element to handle drag'n'drop
            // Only dom elements with 'jqtree-title' class can be used
            // as move handle.
            return ($element.is('.jqtree-title'));
        }
    });
    $tree.tree('openNode', $tree.tree('getNodeById', 1), false);
    resetHeight();
};

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

function resetHeight(callback) {
    var newHeight = $('#tree1').height();
    newHeight = newHeight > 600 ? 600 : newHeight + 17;
    var animationSpeed = newHeight > $('#scroll-container').height() ? 0 : 10;
    $('#scroll-container').animate({ height: newHeight }, 100, callback ? callback() : '');
}