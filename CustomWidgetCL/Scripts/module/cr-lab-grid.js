//inject in your angular module - ['gridCredoLab']

// summary
//-----------------------------------Grid directive-------------------------
//attributes
//cl-grid - apply for element which will be Grid 
//id - identify grid. This need that get selected item or items late (NOTE: if you have more than one grid at the page)
//data - take data for grid
//multiselect - select for more than one row
//grid-template="ID_TEMPLATE" - take content from element by id (example: <script type="text/ng-template" id="templ">YOUR_CONTENT</script>)
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
//----------------------For current element directive cl-Element-------------------------
//selected - if item has selected then this element will be show on html page (NOTE: attribute is use into cl-body)
//------------------------Other attributes
//hide-without-elems - hide element if data for grid is not contains any elements
//show-without-elems - show element if data for grid is not contains any elements
//_________________________________________________________________________________________________________________


//---------------------in controller------------------------
//inject in controller 'clGridContainer' and then get items through function - clGridContainer.clGridSelectedItems('name1');
//This function has one optional parameter. He is identify grid at html page (NOTE: if you have more than one grid at the page)
//Function clGridSelectedItems return one or several items (NOTE:dependence from attribute 'multiselect' if him exists) 


(function () {
    'use strict';
    var app = angular.module('gridCredoLab', []);
    app.constant('clConfig',
    {
        selectedClass: 'cl-row-selected'
    });
    //-----------------------------------Container for all grids on the page------
    app.factory('clGridContainer', clGridContainer);
    function clGridContainer() {
        var clGrids = {};
        var key = 'global';
        return {

            registerClGrid: registerClGrid,
            clGridSelectedItems: clGridSelectedItems
        };

        function clGridSelectedItems(idGrid) {
            var itemsDto = [];
            var data;
            if (angular.isDefined(idGrid) && angular.isDefined(clGrids[idGrid])) {
                data = clGrids[idGrid]();
                return getData(data, itemsDto);
            }
            if (angular.isDefined(clGrids[key])) {
                data = clGrids[key]();
                return getData(data, itemsDto);
            }

            return undefined;
        }
        function getData(source, dest) {
            if (angular.isArray(source)) {
                source.forEach(function (e) {
                    dest.push(e);
                });
                return dest;
            }
            return source;
        }
        function registerClGrid(idGrid, func) {

            if (angular.isDefined(idGrid)) {
                clGrids[idGrid] = func;
                return;
            }
            clGrids[key] = func;
        }

    }
    //-----------------------------------Grid directive-------------------------
    app.directive('clGrid', gridExecute);
    gridExecute.$inject = ['$compile', '$rootScope', 'clGridContainer', 'clConfig'];
    function gridExecute($compile, $rootScope, gridContainer, clConfig) {

        return {
            restrict: 'A',
            scope: true,
            compile: function (tElement, tAttrs, tTransclude) {
                var keyData = tAttrs['data'];

                if (angular.isDefined(tAttrs.gridTemplate)) {
                    tElement.append($(document.getElementById(tAttrs.gridTemplate))[0].innerHTML);
                }

                bodyWrap(tElement);
                setFeatureShowGrid(tElement, true);

                return {
                    pre: function preLink(scope, iElement, iAttrs) {
                        scope.keyData = keyData;

                    },

                }
                function bodyWrap(tElement) {
                    $(tElement).find('[cl-body]')
                        .wrapInner('<span cl-element ng-repeat="item in ' + keyData + '"ng-click="select(item,$event)" class="cl-row" ng-class-odd="\'cl-row-odd\'"></span>');
                }

                function setFeatureShowGrid(tElement) {
                    $(tElement).find('[hide-without-elems]').attr('ng-show', keyData + '[0]');
                    $(tElement).find('[show-without-elems]').attr('ng-show', '!' + keyData + '[0]');
                }

            },
            controller: ['$scope', '$element', '$attrs', gridCtrl]
        }
        function gridCtrl($scope, $element, $attrs) {
            var idGrid = $attrs['id'];
            var isMultiselect = false;
            $scope.idGrid = idGrid;
            var selectedItem;
            var currentElement;

            var selectedItems = [];
            var currentElements = [];

            if (angular.isDefined($attrs.multiselect)) {
                isMultiselect = true;
            }
            $scope.select = function (item, event) {
                var element = $(event.currentTarget);
                if (isMultiselect) {
                    handleMultiselectSelect(element, item);
                } else {
                    handleSelect(element, item);
                }
            };
            if (isMultiselect) {
                gridContainer.registerClGrid(idGrid, function () {
                    return selectedItems;
                });
            } else {
                gridContainer.registerClGrid(idGrid, function () {
                    return selectedItem;
                });
            }
            function handleSelect(element, item) {
                if (angular.isDefined(currentElement)) {
                    currentElement.removeClass(clConfig.selectedClass);
                }
                selectedItem = item;
                currentElement = element;
                currentElement.addClass(clConfig.selectedClass);
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
                    currentElements[index].removeClass(clConfig.selectedClass);
                    currentElements.splice(index, 1);
                    selectedItems.splice(index, 1);
                } else {
                    element.addClass(clConfig.selectedClass);
                    currentElements.push(element);
                    selectedItems.push(item);
                }
            }

        }
    }
    //----------------------Header directive--------------------------
    app.directive('clHeader', headerExecute);
    headerExecute.$inject = ['$filter'];
    function headerExecute($filter) {

        return {
            require: '^clGrid',
            restrict: "A",

            controller: function ($scope, $element, $attrs) {
                var local = $attrs.local;
                var sortAction = $attrs.sortAction;
                $scope.$on('cl-sort' + $scope.idGrid, function (event, args) {

                    if (!angular.isDefined(local) || angular.isDefined(local) && JSON.parse(local) === true) {
                        var path = $scope.keyData.split('.');
                        var data = $scope[path[0]];
                        for (var i = 1; i < path.length; i++) {
                            data = data[path[i]];
                        }
                        if (data !== undefined) {
                            var newData = $filter('orderBy')(data, args.field);
                            Array.prototype.splice.apply(data, [0, newData.length].concat(newData));
                        }
                        $scope.$apply();

                        return;
                    }
                    if (angular.isDefined(local) && JSON.parse(local) === false && angular.isDefined(sortAction)) {
                        $scope[sortAction](args.field);
                        $scope.$apply();
                        return;
                    }
                    throw Error('If you set attribute "local" to value true, maybe you missed attribute "sort-action" in the cl-header directive');

                });

            }

        }
    }
    //----------------------Caption directive-------------------------
    app.directive('clCaption', captionExecute);
    captionExecute.$inject = ['$rootScope'];
    function captionExecute($rootScope) {

        return {
            require: '^clGrid',
            restrict: "A",
            controller: function ($scope, $element, $attrs) {
                var reverse = false;
                if (angular.isDefined($attrs.sortable)) {
                    var sortBtn = angular.element('<i class="ion-ios-arrow-down sort-btn"></i>');
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
                        $rootScope.$broadcast('cl-sort' + $scope.idGrid, { field: aggregate });
                    });
                    $element.append(sortBtn);
                }

            }
        }
    }
    //----------------------Row directive
    app.directive('clElement', elementExecute);
    elementExecute.$inject = ['clConfig'];
    function elementExecute(clConfig) {
        return {
            require: '^clGrid',
            restrict: 'A',
            controller: function ($scope, $element, $attrs) {
                
                $scope.$watch(function () {
                    return $element.attr('class');
                }, function (newValue) {

                    if (newValue.indexOf(clConfig.selectedClass) > 0) {
                        $($element).find('[selected]').show();
                    }
                    else {
                        $($element).find('[selected]').hide();
                    }
                });
            }
        }
    }
})();
