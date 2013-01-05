jQuery.fn.listFilter = function (inputSelector) {
  // cache these for speed
  var list = $(this),
    input = $(inputSelector)
  
  // our handler
  function filter() {
    var query = $(this).val().toLowerCase()
    list.children().each(function (el) {
      var el = $(this),
        val = el.text().toLowerCase()

      if (val.indexOf(query) === -1) {
        el.hide()
      } else {
        el.show()
      }
    })
  }

  // register the handler
  input.change(filter).keyup(filter)
  
  // return self for chaining
  return this
};