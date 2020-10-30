var bkg = chrome.extension.getBackgroundPage();
var bookmarks = [];
var $tree = $('#tree1');
var localStorage = window.localStorage;

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
                chrome.tabs.create({url: node.url, active: !isBackgroundTab(event.click_event.originalEvent)});
            }
        }
    );
    
    $tree.on('tree.open', (event) => {
            if (!$tree.tree('isDragging')) {
                closeOpenNodes(event.node);
                $tree.tree('scrollToNode', event.node)
            }
            $tree.tree('addToSelection', event.node, false);
        }
    );
    
    $tree.on('tree.close', (event) => {
            $tree.tree('removeFromSelection', event.node);
            closeOpenChildNodes(event.node.children);
        }
    );

    $tree.on('auxclick', (event) => {
        if (event.button === 1) {
            const node = $tree.tree('getNodeByHtmlElement', event.target);
    
            if (node && !isFolder(node)) {
                chrome.tabs.create({url: node.url, active: false});
            }
        }
    });

    window.addEventListener('scroll', (event) => {
        localStorage.scrollTop = $(window).scrollTop();
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
})(window);

function isBackgroundTab(event) {
    return (event.metaKey && event.button == 0) || (event.ctrlKey && event.button == 0);
}

function loadBookmarks() {
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
        saveState: true,
        selectable: false,
        closedIcon: $('<i class="fas fa-folder-plus"></i>'),
        openedIcon: $('<i class="fas fa-folder-minus"></i>'),
        onCreateLi: function(node, $li, is_selected) {
            var title = node.name;
            if (!isFolder(node)) {
                var favicon = 'chrome://favicon/size/16@2x/' + node.url;
                $li.find('.jqtree-title')
                    .before('<img id="favicon" class="favicon fas fa-globe-americas" alt="">');
                setTimeout(() => $li.find('#favicon')
                    .replaceWith('<img class="favicon" src="' + favicon + '" alt="">'), 100);
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

    // var openNodes = JSON.parse(localStorage.tree).open_nodes;
    // if (openNodes.length > 0) {
    //     $tree.tree('scrollToNode', $tree.tree('getNodeById', openNodes[openNodes.length - 1]));
    // }
    $('html,body').scrollTop(localStorage.scrollTop);
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