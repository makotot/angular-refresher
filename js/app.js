var app = angular.module('mainApp', ['refresher']);

// handlebars template tag used with Assemble uses {{}} that does not provide method changing template tags.
app.config(function ($interpolateProvider) {
  $interpolateProvider
    .startSymbol('<%')
    .endSymbol('%>');
});

app.controller('mainCtrl', function () {
});
