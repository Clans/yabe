var bkg = chrome.extension.getBackgroundPage();
var bookmarks = [];
var $tree = $('#tree1');
var $bookmarkContextMenu = $('bookmark-context-menu');

chrome.storage.sync.get('color', function (data) {
    // changeColor.style.backgroundColor = data.color;
    // changeColor.setAttribute('value', data.color);
});

window.addEventListener('load', init, false);

function init() {
    document.body.style.height = 600 + 'px';
    document.body.style.width = 350 + 'px';

    loadBookmarks();

    var menu = $tree.jqTreeContextMenu((node) => {
        return isFolder(node) ? $('#menu-folder') : $('#menu-bookmark');
    }, {
        "edit": function (node) { alert('Edit node: ' + node.name); },
        "delete": function (node) { alert('Delete node: ' + node.name); },
        "add": function (node) { alert('Add node: ' + node.name); }
    });

    menu.disable('Bookmarks Bar', ['edit', 'delete']);
    menu.disable('Other Bookmarks', ['edit', 'delete']);
    menu.disable('Mobile Bookmarks', ['edit', 'delete']);
};

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
        dragAndDrop: true,
        // saveState: true
        selectable: false,
        autoOpen: 0,
        closedIcon: $('<i class="fas fa-folder-plus"></i>'),
        openedIcon: $('<i class="fas fa-folder-minus"></i>'),
        onCreateLi: function(node, $li, is_selected) {
            if (!isFolder(node)) {
                var favicon = 'chrome://favicon/size/16@2x/' + node.url;
                $li.find('.jqtree-title').before('<img class="favicon" src="' + favicon + '" width="16" height="16" alt="">');
            }
        },
        onCanMove: function(node) {
            return node.parent.parent;
        },
        onCanMoveTo: function(moved_node, target_node, position) {
            return target_node.parent.parent && (isFolder(target_node) || position == 'after');
        },
        onIsMoveHandle: function($element) {
            // TODO: add custom UI element to handle drag'n'drop
            // Only dom elements with 'jqtree-title' class can be used
            // as move handle.
            return ($element.is('.jqtree-title'));
        }
    });
};

$tree.on(
    'tree.click',
    function(event) {
        event.preventDefault();
        var node = event.node;
        if (isFolder(node)) {
            // closeOpenNodes(node);
            $tree.tree('toggle', node);
            // $tree.tree('addToSelection', node, false);
        } else {
            alert(node.url);
        }
    }
);

$tree.on(
    'tree.open',
    function(e) {
        if (!$tree.tree('isDragging')) {
            closeOpenNodes(e.node);
            $tree.tree('scrollToNode', e.node);
        }
        $tree.tree('addToSelection', e.node, false);
    }
);

$tree.on(
    'tree.close',
    function(e) {
        $tree.tree('removeFromSelection', e.node);
    }
);

function closeOpenNodes(toggleNode) {
    var openNodes = $tree.tree('getSelectedNodes');
    for (var i = 0; i < openNodes.length; i++) {
        var openNode = openNodes[i];
        if (toggleNode.id != openNode.id && toggleNode.parentId == openNode.parentId) {
            $tree.tree('closeNode', openNode, false);
            $tree.tree('removeFromSelection', openNode);
            closeOpenChildNodes(openNode.children);
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