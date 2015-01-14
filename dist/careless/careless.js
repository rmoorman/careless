var util = require('util');
var renderAttributes = require('./render/attr');


  function Component() {"use strict";    
  }
  // TODO deprecate and pass directly to render ?
  Component.prototype.setProps=function(props) {"use strict";
    this.props = props;
  };
  Component.prototype.setContext=function(context) {"use strict";
    this.context = context;
  };


var escapeXml = function(str) {
  return str.replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;'); 
};

var raw = function(str) {
  return {raw: str};
};

var createElement = function(elt, props) {

  props = props || {};
  var children = [];

  for (var i = 2; arguments[i] !== undefined; i++) {
    children.push(arguments[i]);
  }
  props.children = children;

  // "real" node
  if (typeof elt === 'string') {
    return {
      elt: elt,
      props: props
    }
  }

  // Careless node
  if (elt.render) {
    // Old way with createClass()
    var node = {
      props: props
    };

    for (var f in elt) {
      node[f] = elt[f];
    }
  } else if (elt.prototype.render) {
    // New way with a class to be instanciated
    node = new elt();
    node.setProps(props);
  } else if (typeof elt === 'function') {
    // New way with a function (no state for a static doc ! See https://github.com/reactjs/react-future/blob/master/01%20-%20Core/03%20-%20Stateless%20Functions.js)
    node = {
      render: elt,
      props: props
    }
  } else {
    throw new Error("Unsupported type of node while creatingElement");
  }

  return node;
};

// DEPRECATED. Use es6 class instead
var createClass = function(def) {
  return {
    displayName: def.displayName,
    render: def.render
  };
};

var renderToString = function(node, context, resCallback) {

  if (!resCallback) {
    resCallback = function() { throw Error('Callback de ressources non défini'); };
  }

  var out = [];
  var _context = {
    context: context,
    resCallback: resCallback
  };

  _renderToString(node, out, _context);

  return out.join('');
};

var TAGS_NO_SHORT_CLOSING = ['div', 'span', 'p', 'title']; // TODO à compléter

var _renderToString = function(node, out, _context) {

  // null => no render
  if (node === null) {
    return;
  }

  // String or number node => render escaped text
  if (typeof node === 'string' || typeof node === 'number') {
    out.push(escapeXml(String(node)));
    return;
  }

  // Data flagged as raw to avoid escaping
  if (node.raw !== undefined) {
    out.push(String(node.raw));
    return;
  }

  // Array of nodes => render each element
  if (Array.isArray(node)) {
    node.forEach(function(n) {
      _renderToString(n, out, _context);
    });
    return;
  }

  // Careless virtual node with a render function
  // If we have an object with a render function
  if (node.render) {
    if (node.setContext) {
      node.setContext(_context.context);
    }
    _renderToString(node.render(node.props, _context.context, _context.resCallback), out, _context);
    return;
  }

  // "real" node (those beginning with a lowercase letter)
  if (node.elt) {
    out.push('<'+node.elt+renderAttributes(node.props));
    if (node.props.children.length > 0 || TAGS_NO_SHORT_CLOSING.indexOf(node.elt) !== -1) {
      out.push('>');
      for (var i in node.props.children) {
        var child = node.props.children[i];
        _renderToString(child, out, _context);
      }
      out.push('</'+node.elt+'>');
    } else {
      out.push(' />');
    }

    return;
  }

  // ?
  throw Error('Unsupported node : ' + util.inspect(node));
};

// Ex: Careless.__spread({},  blockStyle, {"margin-top": blockSpacing})
var __spread = function(something, spreadee, props) {
  // TODO What is "something" ?

  for (var p in spreadee) {
    if (props[p] === undefined) {
      props[p] = spreadee[p];
    }
  }
  return props;
};

module.exports = {
  createElement: createElement,
  createClass: createClass,
  renderToString: renderToString,
  Component: Component,
  raw: raw,
  escapeXml: escapeXml,
  __spread: __spread
};
