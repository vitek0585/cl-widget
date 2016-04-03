(function() {
    'use strict';
    var app = angular.module('app', ['gridCredoLab']);

    app.controller('global', global);
    global.$inject = ['$scope', 'clGridContainer'];

    function global(scope, clGridContainer) {

        scope.data = [{ id: 1, name: 'vitek' }, { id: 2, name: 'inna' }, { id: 3, name: 'alex' }, { id: 4, name: 'serg' }];
        scope.data1 = [{ id: 10, name: 'vitek' }, { id: 20, name: 'inna' }, { id: 30, name: 'alex' }, { id: 40, name: 'serg' }];
        scope.ind = 100;
        scope.header = 'Title';
        scope.index = 'alex';
        scope.get = function () {
            scope.selctedItem1 = clGridContainer.clGridSelectedItems('name1');
            scope.selctedItem2 = clGridContainer.clGridSelectedItems('name2');
        }
        scope.sort = function(a) {
            console.log(a);
        }
    }
 
})();