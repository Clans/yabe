var bkg = chrome.extension.getBackgroundPage();
var bookmarks = [];
var $tree = $('#tree1');

chrome.storage.sync.get('color', function (data) {
    // changeColor.style.backgroundColor = data.color;
    // changeColor.setAttribute('value', data.color);
});

window.addEventListener('load', init, false);

function init() {
    document.body.style.height = 600 + 'px';
    document.body.style.width = 350 + 'px';
};

(function(window) {
    loadBookmarks();
})(window);

function loadBookmarks() {
    chrome.bookmarks.getTree(function(tree) {
        var data = tree[0].children;
        // addNodes(data);
    
        displayBookmarks(data);
    });
}

function addNodes(data) {
    for (var i = 0; i < data.length; i++) {
        var node = data[i];
        bkg.console.log(node.title);
        addNode(node);
    }
}

function isFolder(node) {
    return typeof node.url  == 'undefined';
}

function addNode(node) {
    var folder = {
        id: node.id,
        label: node.title,
        children: []
    };
    bookmarks.push(folder);
    if (isFolder(node)) {
        addChildrenToFolder(folder, node.children);
        // addNodes(node.children);
    }
}

function addChildrenToFolder(folder, children) {
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        folder.children.push({
            id: child.id,
            label: child.title,
            children: []
        })
        if (isFolder(child)) {
            bkg.console.log("child: " + child.title);
            // addChildrenToFolder(child, child.children);
        }
    }
}

var data = [
    {
        name: 'node1',
        children: [
            { name: 'child1' },
            { name: 'child2' }
        ]
    },
    {
        name: 'node2',
        children: [
            { name: 'child3' }
        ]
    }
];

function displayBookmarks(bookmarks) {
    $tree.tree({
        data: bookmarks,
        dragAndDrop: true,
        // saveState: true
        // autoOpen: 0,
        closedIcon: $('<i class="fas fa-folder-plus"></i>'),
        openedIcon: $('<i class="fas fa-folder-minus"></i>')
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
            $tree.tree('closeNode', openNode);
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
            $tree.tree('closeNode', child);
            $tree.tree('removeFromSelection', child);
            if (child.children) {
                closeOpenChildNodes(child.children);
            }
        }
    }
}