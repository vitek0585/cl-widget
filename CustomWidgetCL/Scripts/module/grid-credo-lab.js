/// <reference path="~/Scripts/angular.js" />

// summary
//-----------------------------------Grid directive-------------------------
//attributes
//cl-grid - apply for element which will be Grid 
//data - take data for grid
//multiselect - select for more than one row
//classes
//.cl-row - for ever row
//.cl-row-odd - for odd row
//----------------------Header directive--------------------------
//attributes
//cl-header - is container for all caption 
//local - by default local='true'. It means that elements ordering will be on client side.
//sort-action - (custom logic sort) if local='false' and sort-action='METHOD_NAME_IN_CONTROLLER' (example: local='false' sort-action='sortEmployee'),
//that elements order will be in controller method. Controller method will get one parameter that contain array with names of fields for sort 
//----------------------Caption directive-------------------------
//attributes
//cl-caption - apply for ever caption
//sortable field="NAME_FIELD_IN_DATA" - this couple attributes include sort column by name of field or name of fields that separate whitespace (example field="FIRST_NAME LAST_NAME")
//classes
//.sort-btn - icon for sort
//.sortable - how will be shown a caption that can use sort

//---------------------in controller------------------------
//$scope.clGridSelectedItems - get several selected items (if exists attribute 'multiselect') 
//$scope.clGridSelectedItem - get one selected item


(function () {
    'use strict';

    var app = angular.module('gridCredoLab', []);

    //-----------------------------------Container for grids--------------------
    app.factory('clGridContainer', clGridContainer);

    function clGridContainer() {
        var selectedItems;

        return {

            removeSelectItem: removeSelectItem,
            addSelectedItem: addSelectedItem,

            clGridSelectedItem: clGridSelectedItem,
            clGridSelectedItems: clGridSelectedItems
        };

        function clGridSelectedItem(idGrid) {
            if (!angular.isDefined(selectedItems))
                return undefined;

            if (angular.isDefined(idGrid)) {
                return selectedItems[idGrid][0];
            }

            return selectedItems[0];
        }
        function clGridSelectedItems(idGrid) {
            if (!angular.isDefined(selectedItems))
                return undefined;

            if (angular.isDefined(idGrid)) {
                return selectedItems[idGrid];
            }

            return selectedItems;
        }
        function addSelectedItem(item, idGrid) {

            init(idGrid);
            if (angular.isDefined(idGrid)) {

                if (!angular.isDefined(selectedItems[idGrid])) {
                    selectedItems[idGrid] = [];
                    selectedItems[idGrid].push(item);

                    console.log(selectedItems);

                    return;
                }
                selectedItems[idGrid].push(item);
                console.log(selectedItems);
                return;
            }

            selectedItems.push(item);
        }

        function init(key) {
            if (!angular.isDefined(selectedItems) && angular.isDefined(key)) {
                selectedItems = {};
            }
            if (!angular.isDefined(selectedItems) && !angular.isDefined(key)) {
                selectedItems = [];
            }
        }
        function removeSelectItem(item, idGrid) {
            if (angular.isDefined(idGrid) && angular.isDefined(selectedItems[idGrid])) {
                removeItemFromArray(selectedItems[idGrid], item);
                return;
            }
            removeItemFromArray(selectedItems, item);
        }

        function removeItemFromArray(array, item) {
            var index;
            array.forEach(function (e, i) {
                if (e === item) {
                    index = i;
                }
            });

            if (angular.isDefined(index)) {
                array.splice(index, 1);
            }
        }
    }
    //-----------------------------------Grid directive-------------------------
    app.directive('clGrid', gridExecute);

    gridExecute.$inject = ['$compile', '$rootScope', 'clGridContainer'];
    function gridExecute($compile, $rootScope, gridContainer) {
        var classSelected = 'cl-row-selected';
        return {
            restrict: 'EA',
            compile: function (tElement, tAttrs, tTransclude) {
                var keyData = tAttrs['data'];

                if (angular.isDefined(tAttrs.gridTemplate)) {
                    tElement = document.getElementById(tAttrs.gridTemplate);
                }
                bodyWrap(tElement);
                return {
                    pre: function preLink(scope, iElement, iAttrs) {

                    },
                }
                function bodyWrap(tElement) {
                    $(tElement).find('[cl-body]')
                        .wrapInner('<span ng-repeat="item in ' + keyData + '"ng-click="select(item,$event)" class="cl-row" ng-class-odd="\'cl-row-odd\'"></span>');

                }

            },
            controller: ['$scope', '$element', '$attrs', gridCtrl]
        }
        function gridCtrl($scope, $element, $attrs) {
            var idGrid = $attrs['id'];
            var isMultiselect = false;
            if (angular.isDefined($attrs.multiselect)) {
                isMultiselect = true;
            }

            var selectedItem;
            var currentElement;
            var selectedItems = [];
            var currentElements = [];
          
            $scope.select = function (item, event) {
                var element = $(event.currentTarget);
                console.log($(element).closest('[cl-grid]'));
                if (isMultiselect) {
                    gridContainer.removeSelectItem(item, idGrid);
                    gridContainer.addSelectedItem(item, idGrid);

                    //handleMultiselectSelect(element, item);
                } else {
                    handleSelect(element, item);
                }
            };

            function handleSelect(element, item) {
                if (angular.isDefined(currentElement)) {
                    currentElement.removeClass(classSelected);
                    gridContainer.removeSelectItem(selectedItem, idGrid);
                }
                //add to container grid
                selectedItem = item;
                gridContainer.addSelectedItem(item, idGrid);
                currentElement = element;
                currentElement.addClass(classSelected);
                $rootScope.$broadcast('select', { data: item });
            }
            function handleMultiselectSelect(element, item) {
                var index;
                selectedItems.forEach(function (e, i) {
                    if (e === item) {
                        index = i;
                    }
                });
                if (angular.isDefined(index)) {
                    currentElements[index].removeClass(classSelected);
                    currentElements.splice(index, 1);
                    selectedItems.splice(index, 1);
                } else {
                    element.addClass(classSelected);
                    currentElements.push(element);
                    selectedItems.push(item);
                }
            }
        }
    }
    //----------------------Header directive--------------------------
    app.directive('clHeader', headerExecute);
    function headerExecute($filter, $timeout) {
        var local;
        var sortAction;
        return {
            require: '^clGrid',
            restrict: "EA",
            link: function (scope, element, attr) {
                local = attr.local;
                sortAction = attr.sortAction;
            },
            controller: function ($scope) {

                $scope.$on('cl-sort', function (event, args) {

                    if (!angular.isDefined(local) || angular.isDefined(local) && JSON.parse(local) === true) {

                        $timeout(function () {
                            $scope[$scope.keyData] = $filter('orderBy')($scope[$scope.keyData], args.field);
                        }, 0, true);
                        return;
                    }
                    if (angular.isDefined(local) && JSON.parse(local) === false && angular.isDefined(sortAction)) {

                        $timeout(function () {
                            $scope[sortAction](args.field);
                        }, 0, true);
                        return;
                    }
                    throw Error('If you set attribute "local" to value true, maybe you missed attribute "sort-action" in the cl-header directive');
                });

            }

        }
    }
    //----------------------Caption directive-------------------------
    app.directive('clCaption', captionExecute);
    function captionExecute($rootScope) {


        return {
            require: '^clGrid',
            restrict: "EA",

            controller: function ($scope, $element, $attrs) {
                var reverse = false;

                if (angular.isDefined($attrs.sortable)) {
                    var sortBtn = angular.element('<i class="glyphicon glyphicon-chevron-down sort-btn"></i>');
                    $($element).addClass('sortable');
                    $element.on('click', function (event) {
                        if (!angular.isDefined($attrs.field)) {
                            throw new Error('The caption not exists a attribute "field", please set attribute and put name of field for sort');
                        }
                        var fields = $attrs.field.split(' ');
                        var aggregate = [];
                        fields.forEach(function (field) {
                            aggregate.push(reverse ? field : '-' + field);
                        });

                        if (!reverse) {
                            $(sortBtn).addClass('reflect-btn');
                        } else {
                            $(sortBtn).removeClass('reflect-btn');
                        }
                        reverse = !reverse;
                        $rootScope.$broadcast('cl-sort', { field: aggregate });
                    });
                    $element.append(sortBtn);
                }

            }
        }
    }

})();
