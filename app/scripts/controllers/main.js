'use strict';

/**
 * @ngdoc function
 * @name ctrlFactoryApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the ctrlFactoryApp
 */
angular.module('ctrlFactoryApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
