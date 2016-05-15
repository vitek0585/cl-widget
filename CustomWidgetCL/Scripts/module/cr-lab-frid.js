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
            selectedRow: selectedRow,
            getFilterData: getFilterData
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
            function getData(source, dest) {
                if (angular.isArray(source)) {
                    source.forEach(function (e) {
                        dest.push(e);
                    });
                    return dest;
                }
                return source;
            }
        }
        function selectedRow(idGrid) {
            return selectedRows(idGrid);
        }
        function registerClGrid(idGrid, func) {

            if (angular.isDefined(idGrid)) {
                clGrids[idGrid] = func;
                return;
            }
            clGrids[key] = func;
        }

        function getFilterData(id) {
            var filterData = undefined;
            if (id === undefined && $('[cl-grid]')[0]) {
                filterData = angular.element($('[cl-grid]')).scope().getFilterData();
            } else if (angular.isDefined(id) && $('#' + id)) {
                filterData = angular.element($('[cl-grid]')).scope().getFilterData();
            }
            return filterData;
        }
    }
    //-----------------------------------Grid directive-------------------------
    app.directive('clGrid', gridExecute);
    gridExecute.$inject = ['$compile', '$rootScope', 'clGridContainer', 'clConfig', 'convertHelper'];
    function gridExecute($compile, $rootScope, gridContainer, clConfig, convertHelper) {

        return {
            restrict: 'A',
            scope: true,
            compile: function (tElement, tAttrs) {
                if (angular.isDefined(tAttrs.gridTemplate)) {
                    tElement.append($(document.getElementById(tAttrs.gridTemplate))[0].innerHTML);
                }

                bodyWrap(tElement);
                setFeatureShowGrid(tElement, true);

                return {
                    pre: function preLink(scope, iElement, iAttrs) {
                        scope.keyData = iAttrs['data'];
                        scope.clData = convertHelper.getDataByKeyObject(scope, scope.keyData);
                        scope.$watchCollection(function () {
                            return convertHelper.convertStringToObjectData(scope, scope.keyData);
                        }, function () {
                            scope.clData = convertHelper.getDataByKeyObject(scope, scope.keyData);
                        });
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
            $scope.getFilterData = getFilterData;

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
            //filter 
            $scope.$on('filter.apply', function () {
                if (angular.isDefined($attrs.serverFilterAction)) {
                    runServerSideFilter($scope, $attrs);
                } else {
                    runLocalFilter($scope);
                }
            });
            function runLocalFilter($scope) {
                var filterElements = getFilterElements();
                var data = convertHelper.getDataByKeyObject($scope, $scope.keyData);
                var i;
                for (i = 0; i < filterElements.length; i++) {
                    var executeLocalFilter = angular.element(filterElements[i]).scope().executeLocalFilter;
                    data = executeLocalFilter(data);
                }
                $scope.clData.length = 0;
                for (i = 0; i < data.length; i++) {
                    $scope.clData.push(data[i]);
                }
            }

            function runServerSideFilter($scope, $attrs) {

                var filterData = getFilterData();
                $scope[$attrs.serverFilterAction](filterData);
            }
            function getFilterElements() {
                return $($element).find('[filter-type]');
            }

            function getFilterData() {
                var filterElements = getFilterElements();
                var filterData = [];
                for (var i = 0; i < filterElements.length; i++) {
                    var dataObject = angular.element(filterElements[i]).scope().executeServerSideFilter();
                    if (dataObject !== undefined)
                        filterData.push(dataObject);
                }
                return filterData;
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
                        //$scope.sortComment = function (comment) {
                        //    var date = new Date(comment.created);
                        //    return date;
                        //};

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
    //----------------------Popup------------------------------
    app.directive('clPopup', clPopup);
    clPopup.$inject = ['$compile'];
    function clPopup($compile) {
        return {
            restrict: 'A',
            //scope: true,
            compile: function (tElement) {

                var left = $(tElement).position().left;
                var div = $('<div ng-show="popup" ng-cloak>');
                div.addClass('popup-box animate-popup');
                div.css({ 'top': $(tElement).position().top + $(tElement).outerHeight(), 'left': left });

                $(tElement).parent().append(div);
                $('.popup-box').click(function (event) {
                    event.stopPropagation();
                });
                return {
                    pre: function (scope, elem, attr) {
                        scope.popup = false;
                        $('html').click(function () {
                            scope.popup = false;
                            scope.$apply();
                        });

                        $(elem).click(function () {
                            scope.popup = !scope.popup;
                            if (scope.popup === true) {
                                refreshPosition(elem);
                            }
                            scope.$apply();
                            event.stopPropagation();
                        });

                        scope.$watch(function () {
                            return scope[attr.clPopupTemplate];
                        }, function (newValue) {
                            var elemContent = angular.element(newValue);
                            $compile(elemContent)(scope);
                            $(elem).parent().find('.popup-box').append(elemContent);
                        });

                        function refreshPosition(tElement) {
                            var left = $(tElement).position().left;
                            var div = $(tElement).parent().find('.popup-box');
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
        conditionViewTemplate: '<div class="btn-group" uib-dropdown is-open="status.isopen">' +
            '<button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>' +
                '{{conditionData.name}}' +
                '<span class="caret float-right"></span>' +
            '</button>' +
                '<ul uib-dropdown-menu role="menu" aria-labelledby="single-button">' +
                    '<li role="menuitem" ng-repeat="condition in conditions" class="pointer dropdown-item">' +
                        '<p class="form-group" ng-click="onConditionSelected(condition)">{{condition.name}}</p>' +
                    '</li>' +
                '</ul>' +
            '</div>',

        textViewTemplate: '<div ><input type="text" class="form-control" ng-model="filterData"/></div>',

        popupViewTemplate: '<div class="distance-top" ng-show="showAdditionalView">' +
                    '<label cl-popup class="form-control cl-popup" cl-popup-template="popupContent">{{filterData}}</label>' +
            '</div>'
    });
    //---------------------------Filter directive---------------------------------
    app.directive('filterType', filterType);
    filterType.$inject = ['filterTemplates', 'conditionFactory', 'filtersManager', '$timeout', '$rootScope'];
    function filterType(filterTemplates, conditionFactory, filtersManager, $timeout, $rootScope) {
        var timer;

        return {
            restrict: "A",
            scope: true,
            compile: function (tElement, tAttrs) {

                if (!angular.isDefined(tAttrs.filterType)) {
                    throw Error('Filter type is not found');
                }

                if (!angular.isDefined(tAttrs.field)) {
                    throw Error('Field for filter data is not found');
                }

                var type = tAttrs.filterType;
                var filter = filtersManager.getFilterByTypeByName(type);

                if (filter == undefined) {
                    throw Error('Filter for type ' + type + ' is not found');
                }

                var containerDiv = $('<div cl-filter-container>').addClass('filter-container');

                filter.viewTemplates.forEach(function (template) {
                    if (angular.isFunction(template)) {
                        $(containerDiv).append(template());
                    } else {
                        var view = filterTemplates[template];
                        if (view !== undefined) {
                            $(containerDiv).append(view);
                        } else {
                            console.log('Template for view ' + template + ' is not found');
                        }
                    }
                });

                $(tElement).wrapInner('<div cl-header-name>');
                setMaxHeightCaptionsName(tElement);
                $(tElement).append(containerDiv);

                return {
                    pre: function inintializeFilter(scope, iElement, iAttrs) {

                        var filter = filtersManager.getFilterByTypeByName(iAttrs.filterType);
                        if (filter.initialize !== undefined) {
                            filter.initialize(scope, iAttrs);
                        }
                        if (filter.conditions === undefined) {
                            throw Error('Conditions for type ' + filter.type + ' is not found');
                        }
                        if (filter.htmlPopup !== undefined) {

                            scope.popupContent = filter.htmlPopup;
                            scope.showAdditionalView = false;
                            scope.filterData = filter.getPopupData(scope);
                            scope.$watch('popup',
                                function (newVal) {
                                    if (newVal === false && scope.showAdditionalView === true) {
                                        scope.filterData = filter.getPopupData(scope);
                                    }
                                });
                        }
                        scope.conditions = filter.conditions;
                        //set name for each condition
                        if (scope[iAttrs.coditionNames] !== undefined) {
                            var conditionNames = scope[iAttrs.coditionNames];
                            for (var i = 0; i < conditionNames.length; i++) {
                                scope.conditions[i].name = conditionNames[i].name;
                            }
                        }
                        var selectedCondition = iAttrs['conditionSelected'];
                        if (selectedCondition !== undefined && angular.isNumber(parseInt(selectedCondition))
                            && selectedCondition > 0 && selectedCondition < scope.conditions.length) {
                            scope.conditionData = scope.conditions[selectedCondition];
                        } else {
                            scope.conditionData = scope.conditions[0];
                        }
                        scope.$on('filter.change', function () {
                            timer = applyFilter(timer);
                        });
                        scope.$watch('conditionData',
                            function (newValue) {
                                if (scope.showAdditionalView !== undefined) {
                                    scope.showAdditionalView = false;
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

                        function applyFilter(timer) {
                            if (timer !== undefined)
                                $timeout.cancel(timer);
                            return $timeout(function () {
                                $rootScope.$broadcast('filter.apply', null);
                            }, 500, true);
                        }
                    }
                }
            },
            controller: function ($scope, $element, $attrs) {
                var field = $attrs.field;

                $scope.onConditionSelected = function (condition) {
                    $scope.conditionData = condition;
                }

                $scope.executeLocalFilter = function (data) {

                    if ($scope.conditionData.executeLocalFilter == null || $scope.conditionData.executeLocalFilter === undefined)
                        return data;

                    var newData = [];

                    for (var i = 0; i < data.length; i++) {
                        if ($scope.conditionData.executeLocalFilter(data[i][field], $scope.filterData, $scope))
                            newData.push(data[i]);
                    }
                    return newData;
                }
                $scope.executeServerSideFilter = function () {
                    if ($scope.conditionData.executeServerSideFilter)
                        return $scope.conditionData.executeServerSideFilter(field, $scope.filterData, $scope);

                    if ($scope.filterData === undefined || $scope.filterData.length === 0)
                        return undefined;
                    var object = {};
                    addToObjectProperty(object, field, $scope.filterData);
                    return object;
                }
                function addToObjectProperty(object, propertyName, propertyValue) {
                    return object[propertyName] = propertyValue;
                }
            }
        }



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
                    var sortBtn = angular.element('<i class="ion-ios-arrow-down sort-btn" cl-sort-button></i>');
                    $($element).addClass('sortable');
                    $element.on('click', function (event) {
                        if (!angular.isDefined(event.target.attributes['sortable'] || event.target.attributes['cl-header-name'] || event.target.attributes['cl-filter-container']
                            || event.target.attributes['cl-sort-button'])) {
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
            controller: function ($scope, $element) {

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
    app.service('convertHelper', convertHelper);
    function convertHelper() {
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
        this.convertStringToObjectData = function ($scope, key) {
            if (!key.split) {
                return $scope[key];
            }
            var path = key.split('.');
            var data = $scope[path[0]];
            for (var i = 1; i < path.length; i++) {
                data = data[path[i]];
            }
            return data;
        }
        this.convertDateToString = function (date) {
            return moment(date).format();
        }
    }
    //---------------------Condition Factory ------------------------------
    app.factory('conditionFactory', conditionFactory);
    function conditionFactory() {

        return {
            //callBack - method will be call after choose current condition
            createConditionForFilter: function (conditionName, executeLocalFilter, executeServerSideFilter, callBack) {
                return new Condition(conditionName, executeLocalFilter, executeServerSideFilter, callBack);
            }
        }
        function Condition(conditionName, executeLocalFilter, executeServerSideFilter, callBack) {

            return {
                name: conditionName,
                executeLocalFilter: executeLocalFilter,
                callBack: callBack,
                executeServerSideFilter: executeServerSideFilter
            }
        }
    }
    //-----------------Filter implementation-------------------------------
    app.factory('filtersManager', filtersManager);
    filtersManager.$inject = ['commonFilterTypes'];
    function filtersManager(commonFilterTypes) {
        var filters = [];
        filters = filters.concat(commonFilterTypes);
        return {

            addFilterType: function (filter) {
                filters.push(filter);
            },
            getFilterByTypeByName: function (typeName) {
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
    app.factory('commonFilterTypes', commonFilterTypes);
    commonFilterTypes.$inject = ['conditionFactory', '$filter', 'convertHelper'];
    function commonFilterTypes(conditionFactory, filter, convertHelper) {

        var filters = [];
        var currentDate = normalizeStartDate(new Date());

        var today = normalizeStartDate(new Date());
        var lastWeek = normalizeStartDate(new Date().setDate(currentDate.getDate() - 7));
        var lastMonth = normalizeStartDate(new Date().setMonth(currentDate.getMonth() - 1));
        var conditionsDate = [
                //1
                conditionFactory.createConditionForFilter('none', function () { return true; }, function () { return undefined; }),
                //2
               conditionFactory.createConditionForFilter('today',
                function (date) {
                    var compareDate = convertStringToDate(date);
                    return today === normalizeStartDate(compareDate);
                }, function () {
                    return { startCreatedDate: convertHelper.convertDateToString(today) };
                }),
                //3
               conditionFactory.createConditionForFilter('last week',
                function (date) {
                    var compareDate = convertStringToDate(date);
                    return lastWeek < compareDate;
                }, function () {
                    return { startCreatedDate: convertHelper.convertDateToString(lastWeek) };
                }),
                //4
                conditionFactory.createConditionForFilter('last month',
                function (date) {
                    var compareDate = convertStringToDate(date);
                    return lastMonth < compareDate;
                }, function () {
                    return { startCreatedDate: convertHelper.convertDateToString(lastMonth) };
                }),
                //5
                conditionFactory.createConditionForFilter('custom',
                function (date, filterData, scope) {
                    if (filterData === undefined || filterData === null || filterData.length === 0)
                        return true;
                    var compareDate = convertStringToDate(date);
                    return scope.datePickerPopup.modelStartDate < compareDate && scope.datePickerPopup.modelEndDate > compareDate;
                }, function (field, filterData, scope) {
                    return {
                        startCreatedDate: convertHelper.convertDateToString(normalizeStartDate(scope.datePickerPopup.modelStartDate)),
                        endCreatedDate: convertHelper.convertDateToString(normalizeEndDate(scope.datePickerPopup.modelEndDate))
                    };

                }, dateAction)];


        filters.push({
            type: 'date',
            conditions: conditionsDate,
            viewTemplates: ['conditionViewTemplate', templateDatePickerRange],
            initialize: function ($scope, attr) {
                var currentDate = new Date();
                $scope.datePickerPopup = {
                    modelStartDate: $scope[attr.minDate] || normalizeStartDate(new Date(currentDate.getFullYear(), 0, 1)),
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
                    maxDate: $scope.datePickerPopup.modelEndDate,
                    showWeeks: false
                }

                $scope.optionsEndCalendar = {
                    minDate: $scope.datePickerPopup.modelStartDate,
                    showWeeks: false
                }
                $scope.$watchGroup(['datePickerPopup.modelStartDate', 'datePickerPopup.modelEndDate'],
                    function (newValues) {
                 
                        if ($scope.datePickerPopup.modelStartDate > $scope.datePickerPopup.modelEndDate) {
                            $scope.datePickerPopup.modelStartDate = $scope.datePickerPopup.modelEndDate;
                            newValues[0] = newValues[1];
                        }
                        if ($scope.datePickerPopup.modelStartDate > today) {
                            $scope.datePickerPopup.modelStartDate = today;
                            newValues[0] = today;
                        }

                        //$scope.datePickerPopup.modelStartDate = moment($scope.datePickerPopup.modelStartDate).local('LLL');
                        $scope.optionsEndCalendar.minDate = newValues[0];
                        $scope.optionsStartCalendar.maxDate = newValues[1];
                        $scope.$broadcast('filter.change');
                    });

                if ($scope[attr.minDate] !== undefined)
                    $scope.optionsStartCalendar.minDate = $scope[attr.minDate];
                if ($scope[attr.maxDate] !== undefined)
                    $scope.optionsEndCalendar.maxDate = $scope[attr.maxDate];
            }
        });
        function templateDatePickerRange() {
            return '<div ng-show="showAdditionalView" class="container-date-pickers">' + getHtmlCalendar('datePickerPopup.openCalStartAction()', 'datePickerPopup.modelStartDate', 'datePickerPopup.openCalStart', 'optionsStartCalendar') +
                getHtmlCalendar('datePickerPopup.openCalEndAction()', 'datePickerPopup.modelEndDate', 'datePickerPopup.openCalEnd', 'optionsEndCalendar') + '</div>';
        }
        function dateAction(scope) {
            scope.showAdditionalView = true;
        }
        //filter for simple input text
        var conditionsText = [
                           conditionFactory.createConditionForFilter('contains',
                           function (dataText, filterText) {
                               if (filterText === undefined || filterText === null || filterText.length === 0)
                                   return true;

                               return dataText.toLowerCase().indexOf(filterText.toLowerCase()) > -1;
                           })];
        filters.push({
            type: 'text',
            conditions: conditionsText,
            viewTemplates: ['textViewTemplate']

        });
        //filter for numbers
        var conditionsNumber = [
            conditionFactory.createConditionForFilter('containsInRange',
                function () {
                    return true;
                }, function (scope) {
                    return undefined;
                })];
        //type filter of number is not working yet
        filters.push({
            type: 'number',
            conditions: conditionsNumber,
            viewTemplates: ['popupViewTemplate'],
            htmlPopup: '<div class="text-center" >From</div>' +
                '<p number-picker value="min"></p>' +
                '<div class="text-center">To</div>' +
                '<p number-picker value="max"></p>',
            getPopupData: function (scope) {
                return 0 + ' - ' + 1;
            }
        });
        return filters;
        //helpers methods
        function normalizeStartDate(currentDate) {
            if (!angular.isDate(new Date(currentDate)))
                return undefined;
            var date = new Date(currentDate);
            date.setHours(0, 0, 0, 0, 0);
            return date;
        }
        function normalizeEndDate(currentDate) {
            var date = normalizeStartDate(new Date().setDate(currentDate.getDate() + 1));
            date.setHours(0, -1, 0, 0);
            return date;
        }
        function convertStringToDate(date) {
            if (angular.isDate(date))
                return date;
            return new Date(date);
        }
        function getHtmlCalendar(openFunction, ngModel, isOpenVarableCondition, options) {
            return '<div><input type="text" uib-datepicker-popup="shortDate" ng-click="' + openFunction + '" class="form-control" ' +
                    'ng-model="' + ngModel + '" ' +
                    'is-open="' + isOpenVarableCondition + '" show-button-bar="false" datepicker-options="' + options + '"/></div>';
        }
    }

    app.directive('normalizeDate', ['$filter', 'convertHelper',
        function (filter, convertHelper) {
            return {
                require: 'ngModel',
                restrict: 'A',
                link: function (scope, element, attr, ngModel) {
                    ngModel.$formatters.length = 0;
                    ngModel.$formatters.unshift(function (utcDate) {
                        var m = ngModel;
                        if (!utcDate)
                            return;

                        return filter('formatDate')(utcDate);
                    });
                    ngModel.$parsers.length = 0;
                    ngModel.$parsers.unshift(function (modelValue) {
                        var m = ngModel;
                        if (!angular.isDate(new Date(modelValue)))
                            return modelValue;
                        return new Date(modelValue);
                    });
                    scope.$watch(function () {
                        return convertHelper.convertStringToObjectData(scope, attr.doNormalize);
                    }, function (checkValidate) {

                        if (checkValidate === false)
                            return;

                        if (ngModel.$modelValue)
                        ngModel.$modelValue = ngModel.$formatters[0](ngModel.$modelValue);

                        //ngModel.$viewValue = filter('formatDate')(modelValue);
                        //element[0].value = filter('formatDate')(modelValue);
                    });
                    scope.$watch(function () {
                        return ngModel.$viewValue;
                    }, function (modelValue) {
                        var m = ngModel;
                        var ifCheckDate = convertHelper.convertStringToObjectData(scope, attr.doNormalize);
                        if (!angular.isDate(modelValue))
                            return;

                        ngModel.$modelValue = ngModel.$formatters[0](ngModel.$modelValue);

                        //ngModel.$viewValue = filter('formatDate')(modelValue);
                        //element[0].value = filter('formatDate')(modelValue);
                    });
                    //scope.$watch(function () {
                    //    return element[0].value;
                    //}, function (modelValue) {

                    //    if (!angular.isDate(new Date(modelValue)))
                    //        return;
                    //    ngModel.$modelValue = new Date(modelValue);
                    //});
                }
            }
        }]);
    //LOCALE GRID
    app.filter('formatDate', function () {
        return function (date) {
            return moment(date).format('L');
        }
    });
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
            template: function () {
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
                    if (src.hasOwnProperty(key)) {
                        if (dest[key]) {
                            o[key] = dest[key];
                        } else {
                            o[key] = src[key];
                            dest[key] = src[key];
                        }
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
                    if (opts.hasOwnProperty(key)) {
                        opts[key] = this.toNumber(opts[key]);
                    }
                }
            },
            getId: function () {
                this.index += 1;
                return 'number-picker-' + this.index;
            }
        };
    });



})();
