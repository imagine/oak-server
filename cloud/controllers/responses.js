var _ = require('underscore');
var PromptResponse = Parse.Object.extend('PromptResponse');

// Display all responses.
exports.index = function(req, res) {
  Parse.Cloud.useMasterKey()
  var query = new Parse.Query(PromptResponse);
  query.descending('createdAt');
  query.find().then(function(results) {
    res.render('responses/index', { 
      responses: results
    });
  },
  function() {
    res.send(500, 'Failed loading responses');
  });
};

// Show a given response based on specified id.
exports.show = function(req, res) {
  Parse.Cloud.useMasterKey()
  var responseQuery = new Parse.Query(PromptResponse);
  var foundResponse;
  responseQuery.get(req.params.id).then(function(response) {
    if (response) {
      foundResponse = response;
      return [];
    } else {
      return [];
    }
  }).then(function() {
    res.render('responses/show', {
      response: foundResponse,
    });
  },
  function() {
    res.send(500, 'Failed finding the specified response to show');
  });
};


exports.showUser = function(req, res) {
  Parse.Cloud.useMasterKey()
  var query = new Parse.Query(PromptResponse);
  var author = new Parse.User();
  author.id = req.params.id;
  query.equalTo('author', author);
  query.descending('createdAt');
  query.find().then(function(results) {
    res.render('responses/index', { 
      responses: results
    });
  },
  function() {
    res.send(500, 'Failed loading responses');
  });
};
