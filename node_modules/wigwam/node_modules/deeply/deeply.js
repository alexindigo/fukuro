// loader boilerplate
!function(name, definition){
  if (typeof module != 'undefined') module.exports = definition();
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition);
  else this[name] = definition();
}('deeply', function()
{
  // actual thing goes below

  function deeply(/* a[, b[, ...[, reduceArrays]]] */)
  {
    var o
      , prop
      , result       = {}
      , args         = Array.prototype.slice.call(arguments)
      , reduceArrays = typeof args[args.length-1] == 'function' ? args.pop() : undefined
      ;

    while (o = args.shift())
    {
      for (prop in o)
      {
        if (!o.hasOwnProperty(prop)) continue;

        if (typeof o[prop] == 'object' && typeOf(o[prop]) == 'object')
        {
          result[prop] = deeply(result[prop] || {}, o[prop], reduceArrays);
        }
        // check if there is custom reduce function for array merging
        else if (reduceArrays && typeOf(o[prop]) == 'array')
        {
          // make sure it's all untangled
          result[prop] = reduceArrays(result[prop] || [], Array.prototype.slice.call(o[prop]));
        }
        else
        {
          result[prop] = o[prop];
        }
      }
    }

    return result;
  }

  // precise typing
  function typeOf(obj)
  {
    return Object.prototype.toString.call(obj).match(/\[object\s*([^\]]+)\]/)[1].toLowerCase();
  }

  // done

  return deeply;
});
