﻿//inject in your angular module - ['gridCredoLab']

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

    var app = angular.module('gridCredoLab', ['ui.bootstrap']);

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
            selectedRows: selectedRows,
            selectedRow: selectedRow
        };

        function selectedRows(idGrid) {
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
        function selectedRow(idGrid) {
            return selectedRows(idGrid);
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
    gridExecute.$inject = ['$compile', '$rootScope', 'clGridContainer', 'clConfig', 'parseDataHelper'];
    function gridExecute($compile, $rootScope, gridContainer, clConfig, parseDataHelper) {

        return {
            restrict: 'A',
            scope: true,
            compile: function (tElement, tAttrs, tTransclude) {
                // var keyData = ['clData'];

                if (angular.isDefined(tAttrs.gridTemplate)) {
                    tElement.append($(document.getElementById(tAttrs.gridTemplate))[0].innerHTML);
                }

                bodyWrap(tElement);
                setFeatureShowGrid(tElement, true);

                return {
                    pre: function preLink(scope, iElement, iAttrs) {
                        scope.keyData = iAttrs['data'];
                        scope.clData = parseDataHelper.getDataByKeyObject(scope, scope.keyData);
                    }
                }
                function bodyWrap(tElement) {
                    $(tElement).find('[cl-body]')
                        .wrapInner('<span cl-element ng-repeat="item in clData" ng-click="select(item,$event)" class="cl-row" ng-class-odd="\'cl-row-odd\'"></span>');
                }

                function setFeatureShowGrid(tElement) {
                    $(tElement).find('[hide-without-elems]').attr('ng-show', 'clData[0]');
                    $(tElement).find('[show-without-elems]').attr('ng-show', '!clData[0]');
                }

            },
            controller: ['$scope', '$element', '$attrs', gridCtrl]
        }
        function gridCtrl($scope, $element, $attrs) {
            var idGrid = $attrs['id'];
            var isMultiselect = false;
            $scope.idGrid = idGrid;
            $scope.gridFilterActions = [];
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
            $scope.$on('filter.apply', function () {
                if (angular.isDefined($attrs.filterAction)) {
                    runFilterRemote($scope);
                } else {
                    runFilterLocal($scope);
                }
            });
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
            //filter logic

            function runFilterLocal($scope) {
                var filterElements = getFilterElements();
                var data = parseDataHelper.getDataByKeyObject($scope, $scope.keyData);

                for (var i = 0; i < filterElements.length; i++) {
                    var action = angular.element(filterElements[i]).scope().actionFilter;
                    data = action(data);
                }
                $scope.clData.length = 0;
                for (var i = 0; i < data.length; i++) {
                    $scope.clData.push(data[i]);
                }
            }

            function runFilterRemote($scope, $element) {
                var filterElements = getFilterElements();
                var data = [];
                for (var i = 0; i < filterElements.length; i++) {
                    console.log(angular.element(filterElements[i]).scope().infoFilter());
                }

            }
            function getFilterElements() {
                return $($element).find('[cl-filter]');
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

                        var newData = $filter('orderBy')($scope.clData, args.field);
                        Array.prototype.splice.apply($scope.clData, [0, newData.length].concat(newData));
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
    //----------------------Popover------------------------------
    app.directive('clPopover', popover);
    popover.$inject = ['$compile'];
    function popover($compile) {
        return {
            restrict: 'A',
            //scope: true,
            compile: function (tElement, tAttrs, tTransclude) {

                var left = $(tElement).position().left;
                var div = $('<div ng-show="popover" ng-cloak>');
                div.addClass('popover-box animate-popover');
                div.css({ 'top': $(tElement).position().top + $(tElement).outerHeight(), 'left': left });

                $(tElement).parent().append(div);
                $('.popover-box').click(function (event) {
                    event.stopPropagation();
                });
                return {
                    pre: function (scope, elem, attr) {
                        scope.popover = false;
                        $('html').click(function () {
                            scope.popover = false;
                            scope.$apply();
                        });

                        $(elem).click(function () {
                            scope.popover = !scope.popover;
                            if (scope.popover === true) {
                                refreshPosition(elem);
                            }
                            scope.$apply();
                            event.stopPropagation();
                        });

                        scope.$watch(function () {
                            return scope[attr.clPropoverTemplate];
                        }, function (newValue) {
                            var elemContent = angular.element(newValue);
                            $compile(elemContent)(scope);
                            $(elem).parent().find('.popover-box').append(elemContent);
                        });

                        function refreshPosition(tElement) {
                            var left = $(tElement).position().left;
                            var div = $(tElement).parent().find('.popover-box');
                            div.css({ 'top': $(tElement).position().top + $(tElement).outerHeight(), 'left': left });
                        }

                    }
                }

            }
        }
    }
    //-----------------------Filter templates-----------------------------
    app.constant('filterTemplates',
    {
        conditionalViewTemplate: '<div class="btn-group" uib-dropdown is-open="status.isopen">' +
            '<button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>' +
                '{{conditionalData.name}}' +
                '<span class="caret float-right"></span>' +
            '</button>' +
                '<ul uib-dropdown-menu role="menu" aria-labelledby="single-button">' +
                    '<li role="menuitem" ng-repeat="conditional in conditionals" class="pointer dropdown-item">' +
                        '<p class="form-group" ng-click="onConditionalSelected(conditional)">{{conditional.name}}</p>' +
                    '</li>' +
                '</ul>' +
            '</div>',

        textViewTemplate: '<div ><input type="text" class="form-control" ng-model="filterData"/></div>',

        popoverViewTemplate: '<div class="distance-top" ng-show="showInputForPopover">' +
                    '<label cl-popover class="form-control cl-popover" cl-propover-template="propoverContent">{{filterData}}</label>' +
            '</div>',
    });
    //---------------------------Filter directive---------------------------------
    app.directive('clFilter', clFilter);
    clFilter.$inject = ['filterTemplates', 'parseDataHelper', 'conditionalFactory', 'filtersManager', '$timeout', '$rootScope'];
    function clFilter(filterTemplates, parseDataHelper, conditionalFactory, filtersManager, $timeout, $rootScope) {
        var timer;

        return {
            restrict: "A",
            scope: true,
            compile: function (tElement, tAttrs, tTransclude) {

                if (!angular.isDefined(tAttrs.clFilter)) {
                    throw Error('Not found filter type (Example filter="YOUR_FILTER")');
                }

                if (!angular.isDefined(tAttrs.field)) {
                    throw Error('Not found field for filtering data (Example field="YOUR_NAME_FIELD)');
                }

                var type = tAttrs.clFilter;
                var filter = filtersManager.getFilterByType(type);

                if (filter == undefined) {
                    throw Error('Not found any filter for current type - ' + type);
                }

                var containerDiv = $('<div>').addClass('filter-container');

                filter.viewTemplates.forEach(function (template) {
                    if (angular.isFunction(template)) {
                        $(containerDiv).append(template());
                    }
                    var view = filterTemplates[template];
                    if (view !== undefined) {
                        $(containerDiv).append(view);
                    } else {
                        console.log('Not found any templates for view name ' + template);
                    }
                });
                $(tElement).wrapInner('<div cl-header-name>');
                setMaxHeightCaptionsName(tElement);
                $(tElement).append(containerDiv);

                return {
                    pre: function preLink(scope, iElement, iAttrs) {

                        var filter = filtersManager.getFilterByType(iAttrs.clFilter);
                        if (filter.initialize !== undefined) {
                            filter.initialize(scope, iAttrs);
                        }
                        if (filter.conditionals === undefined) {
                            throw Error('Not found any filter for current type - ' + type);
                        }
                        if (filter.htmlPopover !== undefined) {

                            scope.propoverContent = filter.htmlPopover;
                            scope.showInputForPopover = false;
                            scope.filterData = filter.getPropoverData(scope);
                            scope.$watch('popover',
                                function (newVal) {
                                    if (newVal === false && scope.showInputForPopover === true) {
                                        scope.filterData = filter.getPropoverData(scope);
                                    }
                                });
                        }
                        scope.conditionals = filter.conditionals;
                        scope.conditionalData = scope.conditionals[0];
                        scope.$watch('conditionalData',
                            function (newValue) {
                                if (scope.showInputForPopover !== undefined) {
                                    scope.showInputForPopover = false;
                                }

                                timer = applyFilter(timer);

                                if (newValue.callBack !== undefined) {
                                    newValue.callBack(scope);
                                }
                                setTimeout(function () {
                                    calculateCaptionFilterPosition(iElement);
                                }, 0, false);

                            });


                        scope.$watch('filterData',
                            function () {
                                timer = applyFilter(timer);
                            });


                    }
                }
            },
            controller: function ($scope, $element, $attrs) {
                var field = $attrs.field;

                $scope.onConditionalSelected = function (conditional) {
                    $scope.conditionalData = conditional;
                }

                $scope.actionFilter = function (data) {

                    if ($scope.conditionalData.predicate == null || $scope.conditionalData.predicate === undefined)
                        return data;

                    var newData = [];

                    for (var i = 0; i < data.length; i++) {
                        if ($scope.conditionalData.predicate(data[i][field], $scope.filterData, $scope))
                            newData.push(data[i]);
                    }
                    return newData;
                }
                $scope.infoFilter = function () {
                    return {
                        conditionalData: $scope.conditionalData,
                        field: field
                    }
                }

            }

        }
        //filter logic
        function applyFilter(timer) {

            if (timer !== undefined)
                $timeout.cancel(timer);

            return $timeout(function () {
                $rootScope.$broadcast('filter.apply', null);
            }, 500, true);
        }
        //end filter logic
        //Calculate caption position
        function setMaxHeightCaptionsName(tElement) {

            var maxHeight = getMaxHeight($(tElement).parent(), '[cl-header-name]');
            $(tElement).parent()
                .find('[cl-header-name]')
                .css('height', maxHeight);
        }

        function calculateCaptionFilterPosition(tElement) {
            var maxHeight = getMaxHeight($(tElement).parent(), '.filter-container');
            $('.filter-container').css('height', maxHeight);
        }

        function getMaxHeight(tElement, selector) {
            var maxHeight = 0;
            $('.filter-container').css('height', 'auto');

            $(tElement).find(selector)
                    .each(function (e, v) {
                        if (maxHeight < $(v).height()) {
                            maxHeight = $(v).height();
                        }
                    });
            return maxHeight;
        }

    }
    //----------------------Caption directive-------------------------
    app.directive('clCaption', captionExecute);
    captionExecute.$inject = ['$rootScope'];
    function captionExecute($rootScope) {

        return {
            require: '^clGrid',
            restrict: "A",
            scope: true,

            controller: function ($scope, $element, $attrs) {
                var reverse = false;
                if (angular.isDefined($attrs.sortable)) {
                    var sortBtn = angular.element('<i class="ion-ios-arrow-down sort-btn"></i>');
                    $($element).addClass('sortable');
                    $element.on('click', function (event) {
                        if (!angular.isDefined(event.target.attributes['sortable'] || event.target.attributes['cl-header-name'])) {
                            return;
                        };
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
    //----------------------Helpers---------------------------------
    app.service('parseDataHelper', parseDataHelper);
    function parseDataHelper() {

        this.getDataByKeyObject = function ($scope, key) {

            if (!key.split) {
                if (angular.isArray($scope[key])) {
                    return $scope[key].map(function (item) { return item; });
                }
                return $scope[key];
            }

            var path = key.split('.');
            var data = $scope[path[0]];
            for (var i = 1; i < path.length; i++) {
                data = data[path[i]];
            }
            if (angular.isArray(data)) {
                return data.map(function (item) { return item; });
            }
            return data;
        }

    }
    //---------------------Conditional Factory ------------------------------
    app.factory('conditionalFactory', conditionalFactory);
    function conditionalFactory() {

        return {
            //callBack - method will be call after choose current conditional
            createConditionalForFilter: function (conditionalName, predicate, callBack) {
                return new Conditional(conditionalName, predicate, callBack);
            }
        }
        function Conditional(conditionalName, predicate, callBack) {

            return {
                name: conditionalName,
                predicate: predicate,
                callBack: callBack
            }
        }
    }
    //-----------------Filter implementation-------------------------------
    app.factory('filtersManager', filtersManager);
    filtersManager.$inject = ['commonFilters'];
    function filtersManager(commonFilters) {
        var filters = [];
        filters = filters.concat(commonFilters);
        return {

            addFilter: function (filter) {
                filters.push(filter);
            },
            getFilterByType: function (typeName) {
                var flrs = filters.filter(function (filter) {
                    if (filter.type === typeName)
                        return true;
                    return false;
                });
                if (flrs[0])
                    return flrs[0];

                return undefined;
            }
        };

    }
    //--------------------------Common filter----------------------
    app.factory('commonFilters', commonFilters);
    commonFilters.$inject = ['conditionalFactory', '$filter'];
    function commonFilters(conditionalFactory, filter) {
        var filters = [];
        var conditionalsDate = [conditionalFactory.createConditionalForFilter('none', function () { return true; }),
                conditionalFactory.createConditionalForFilter('today',
                function (date) {
                    var compareDate = convertStringToDate(date);
                    return removeTimeFromDate(new Date()).getDate() === (removeTimeFromDate(compareDate)).getDate();
                }),
                conditionalFactory.createConditionalForFilter('last week',
                function (date) {
                    var compareDate = convertStringToDate(date);
                    var currentDate = new Date();
                    return new Date(currentDate.setDate(currentDate.getDate() - 7)) < compareDate;
                }),
                conditionalFactory.createConditionalForFilter('last month',
                function (date) {
                    var compareDate = convertStringToDate(date);
                    var currentDate = new Date();
                    return new Date(currentDate.setMonth(currentDate.getMonth() - 1)) < compareDate;
                }),
                conditionalFactory.createConditionalForFilter('custom',
                function (date, filterData, scope) {
                    if (filterData === undefined || filterData.length === 0)
                        return true;
                    var compareDate = convertStringToDate(date);
                    return scope.popup.modelStartDate < compareDate && scope.popup.modelEndDate > compareDate;
                }, dateAction)];

        function dateAction(scope) {
            scope.showInputForPopover = true;
        }
        filters.push({
            type: 'date',
            conditionals: conditionalsDate,
            viewTemplates: ['conditionalViewTemplate', 'popoverViewTemplate'],
            htmlPopover:
                '<div class="text-center">Start date</div>' +
                '<div>' + getHtmlCalendar('popup.openCalStartAction()', 'popup.modelStartDate', 'popup.openCalStart', 'optionsStartCalendar') + '</div>' +
                '<div class="text-center">End date</div>' +
                '<div>' + getHtmlCalendar('popup.openCalEndAction()', 'popup.modelEndDate', 'popup.openCalEnd', 'optionsEndCalendar') + '</div>',
            initialize: function ($scope, attr) {
                var currentDate = new Date();
                $scope.popup = {
                    modelStartDate: $scope[attr.minDate] || new Date(currentDate.setMonth(currentDate.getMonth() - 12)),
                    modelEndDate: $scope[attr.maxDate] || new Date(),
                    openCalStart: false,
                    openCalEnd: false,
                    openCalStartAction: function () {
                        this.openCalStart = !this.openCalStart;
                        this.openCalEnd = false;
                    },
                    openCalEndAction: function () {
                        this.openCalEnd = !this.openCalEnd;
                        this.openCalStart = false;
                    }
                };
                $scope.optionsStartCalendar = {
                    maxDate: $scope.popup.modelEndDate
                }

                $scope.optionsEndCalendar = {
                    minDate: $scope.popup.modelStartDate
                }
                $scope.$watchGroup(['popup.modelStartDate', 'popup.modelEndDate'],
                    function (newValues) {
                        $scope.optionsEndCalendar.minDate = newValues[0];
                        $scope.optionsStartCalendar.maxDate = newValues[1];
                    });

                if ($scope[attr.minDate] !== undefined)
                    $scope.optionsStartCalendar.minDate = $scope[attr.minDate];
                if ($scope[attr.maxDate] !== undefined)
                    $scope.optionsEndCalendar.maxDate = $scope[attr.maxDate];
            },
            getPropoverData: function (scope) {
                return formatProvider(scope.popup.modelStartDate) + ' - ' + formatProvider(scope.popup.modelEndDate);
            }
        });
        //filter for simple input text
        var conditionalsText = [
                           conditionalFactory.createConditionalForFilter('contains',
                           function (dataText, filterText) {
                               if (filterText === undefined || filterText.length === 0)
                                   return true;

                               return dataText.indexOf(filterText) > -1;
                           })];
        filters.push({
            type: 'text',
            conditionals: conditionalsText,
            viewTemplates: ['textViewTemplate']

        });
        //filter for numbers
        var numberConditional = [
            conditionalFactory.createConditionalForFilter('containsInRange',
                function () {
                    return true;
                }, function (scope) {
                    scope.showInputForPopover = true;
                })];
        filters.push({
            type: 'number',
            conditionals: numberConditional,
            viewTemplates: ['popoverViewTemplate'],
            htmlPopover: '<div class="text-center" >From</div>' +
                '<p number-picker value="min"></p>' +
                '<div class="text-center">To</div>' +
                '<p number-picker value="max"></p>',
            getPropoverData: function (scope) {
                return 0 + ' - ' + 1;
            }
        });
        return filters;
        //helpers methods
        function removeTimeFromDate(currentDate) {
            var date = new Date(currentDate);
            date.setHours(0, 0, 0, 0, 0);
            return date;
        }
        function formatProvider(date, format) {
            return filter('date')(date);
        }
        function convertStringToDate(date) {
            if (angular.isDate(date))
                return date;
            return new Date(date);
        }
        function getHtmlCalendar(openFunction, ngModel, isOpenVarableConditional, options) {
            return '<div class="distance-top"><input type="text" uib-datepicker-popup ng-click="' + openFunction + '" class="form-control" ' +
                    'ng-model="' + ngModel + '" ' +
                    'is-open="' + isOpenVarableConditional + '" show-button-bar="false" datepicker-options="' + options + '"/></div>';
        }
    }
    //--------------------------number template
    app.directive('numberPicker', ['numberPickerService', function (service) {
        'use strict';

        var config = {
            min: 0,
            max: Infinity,
            step: 1

        },
          base = {
              restrict: 'E,A',
              scope: {
                  'value': '=',
                  'min': '@',
                  'max': '@',
              }
          };

        return angular.extend(base, {
            //check if number
            link: function (scope) {
                var opts = service.assignExtend(scope, config);
                if (!service.checkNumber([opts.min, opts.max, opts.step])) {
                    throw new Error('some value: (min, max or step) is not a valid number');
                }
                scope.id = service.getId();

                //transform string to number
                service.transform(opts);

                //change current value if min value is bigger
                if (opts.min > scope.value) {
                    scope.value = opts.min;
                }
                //change current value if max value is small
                if (opts.max < scope.value) {
                    scope.value = opts.max;
                }

                //watch for disabled buttons
                scope.$watch('value', function (newValue, oldValue) {
                    var min = opts.min,
                        max = opts.max;

                    scope.canDown = newValue > min;
                    scope.canUp = newValue < max;
                    scope.isMaxValue = !scope.canUp;
                    scope.isMinValue = !scope.canDown;

                    if ((!service.checkNumber(newValue) || newValue > max || newValue < min) && newValue !== '') {
                        //set oldValue or min value if oldValue isn't number when newValue isn't a number or newValue more than max or newValue less than min
                        scope.value = service.checkNumber(oldValue) ? oldValue : opts.min;
                    }
                });

            },
            template: function() {
                return '<input type=\"text\" ng-model=\"value\" class=\"form-control text-center\" ng-readonly=\"enter\" id=\"{{id}}\">';
            }
        });
    }]);
    app.service('numberPickerService', function () {
        'use strict';

        return {
            index: 0,
            assignExtend: function (dest, src) {
                var o = {};

                for (var key in src) {
                    if (dest[key]) {
                        o[key] = dest[key];
                    } else {
                        o[key] = src[key];
                        dest[key] = src[key];
                    }
                }
                return o;
            },
            isNumber: function (value) {
                var val = Number(value);
                return !isNaN(val) && val === +value;
            },
            toNumber: function (value) {
                return Number(value);
            },
            checkNumber: function (value) {
                var self = this,
                  //count no numbers
                  cnn = 0;

                if (angular.isArray(value)) {
                    angular.forEach(value, function (v) {
                        if (!self.isNumber(v)) {
                            cnn += 1;
                        }
                    });
                    if (cnn > 0) {
                        return false;
                    }
                    return true;
                }
                if (!this.isNumber(value)) {
                    return false;
                }
                return true;
            },
            transform: function (opts) {
                for (var key in opts) {
                    opts[key] = this.toNumber(opts[key]);
                }
            },
            getId: function () {
                this.index += 1;
                return 'number-picker-' + this.index;
            }
        };
    });



})();

