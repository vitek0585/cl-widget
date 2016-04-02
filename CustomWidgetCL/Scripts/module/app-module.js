(function() {
    'use strict';
    var app = angular.module('app', ['gridCredoLab']);
    app.controller('ctrl', ctrl);

    ctrl.$inject = ['$scope', 'clGridContainer'];

    function ctrl(scope, clGridContainer) {

        scope.data = [{ id: 1, name: 'vitek' }, { id: 2, name: 'inna' }, { id: 3, name: 'alex' }, { id: 4, name: 'serg' }];
        scope.data1 = [{ id: 10, name: 'vitek' }, { id: 20, name: 'inna' }, { id: 30, name: 'alex' }, { id: 40, name: 'serg' }];

        scope.selctedItems = [];
        scope.get = function() {
            //scope.selctedItem1 = clGridContainer.clGridSelectedItem('name1');

            scope.selctedItem2 = clGridContainer.clGridSelectedItem('name2');
            //if (item !== undefined)
            //    scope.selctedItems.push(item);
        }
    }
})();