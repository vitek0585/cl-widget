(function () {
    'use strict';
    var statusCodes = {
        Unauthorized: 401,
        InternalServerError: 500,
        Ok: 200
    }

    var responseHandlingModule = angular.module("responseHandlingApp", ['toaster']);
    responseHandlingModule.constant('statusCodes', statusCodes);
    // setup angular config 
    responseHandlingModule.config(function ($httpProvider) {
        // add header to all request 
        $httpProvider.defaults.headers.common["X-Requested-With"] = 'XMLHttpRequest';

        // response interceptor
        $httpProvider.interceptors.push('httpResponseInterceptor');
    });
    // setup jquery config
    responseHandlingModule.run(['httpResponseInterceptor', function (responseInterceptor) {
        $(document).ajaxComplete(responseInterceptor.responseJquery);
    }]);
    // notifier factory initialize
    responseHandlingModule.factory("notifier", notifier);
    responseHandlingModule.$inject = ['toaster'];
    function notifier(toaster) {

        return {
            notifySuccess: notifySuccess,
            notifyWarning: notifyWarning,
            notifyError: notifyError
        }

        function notifySuccess(message, title) {
            toaster.success(message, title);
        }

        function notifyWarning(message, title) {
            toaster.warning(message, title);
        }

        function notifyError(message, title) {
            toaster.error(message, title);
        }
    };
    // response Interceptor
    responseHandlingModule.factory('httpResponseInterceptor', ['notifier', '$timeout',
        function (notifier, $timeout) {

            var excludeStatusCodes = [];
            var handlingOk = new HandlingOk(undefined, notifier);
            var handlingInternalServerError = new HandlingInternalServerError(handlingOk, notifier);
            var handlingUnauthorized = new HandlingUnauthorized(handlingInternalServerError);
            return {
                response: function (response) {
                    angularHandler(response);
                },
                responseError: function (response) {
                    angularHandler(response);
                },
                responseJquery: function (event, xhr, settings) {
                    var headersArray = xhr.getAllResponseHeaders();
                    var headers = {};
                    headersArray.split('\n').forEach(function (headerString) {
                        var header = headerString.split(':');
                        if (header[0] && header[0].length > 0) {
                            headers[header[0]] = header[1];
                        }
                    });
                    var responseData = $.parseJSON(xhr.responseText);
                    $timeout(function () {
                        handlingResponse(xhr.status, responseData, headers);
                    }, 0, true);
                }
            }

            function angularHandler(response) {
                var headers = response.headers();
                handlingResponse(response.status, response.data, headers);
                return response;
            }
            function handlingResponse(statusCode, responseData, headers) {

                if (isExcludedStatusCode(statusCode))
                    return;

                handlingUnauthorized.handle(statusCode, responseData, headers);
            }

            // check status code that it has not excluded 
            function isExcludedStatusCode(currentStatusCode) {
                return excludeStatusCodes.some(function (statusCode) {
                    return currentStatusCode === statusCode;
                });
            }
        }]);
    //
    function HandlingResponseBase(initializeStatusCode, handleResponseNext, executeHandleFunc) {
        var statusCode = parseInt(initializeStatusCode);
        var handleResponse = handleResponseNext;

        this.handle = function (currentStatusCode, responseData, headers) {
            if (statusCode === currentStatusCode) {
                executeHandleFunc(responseData, headers);
            } else if (handleResponse) {
                handleResponse.handle(currentStatusCode, responseData, headers);
            }
        }
    }

    function HandlingUnauthorized(handleResponseNext) {
        HandlingResponseBase.call(this, statusCodes.Unauthorized, handleResponseNext, executeHandleFunc);
        var unauthorizedResponseHeader = 'x-responded-json';
        function executeHandleFunc(responseData, headers) {

            if (headers[unauthorizedResponseHeader] !== undefined) {
                var xheader = headers[unauthorizedResponseHeader];
                var obj = JSON.parse(xheader);
                var location = obj.headers.location;
                var index = location.indexOf('?');
                var currentLocation = location.substring(0, index);
                document.location = currentLocation;
            }
        }
    }

    function HandlingInternalServerError(handleResponseNext, notifierInit) {
        HandlingResponseBase.call(this, statusCodes.InternalServerError, handleResponseNext, executeHandleFunc);
        var notifier = notifierInit;

        function executeHandleFunc(responseData) {
            notifier.notifyError(responseData.message, "500");
        }
    }

    function HandlingOk(handleResponseNext, notifierInit) {
        HandlingResponseBase.call(this, statusCodes.Ok, handleResponseNext, executeHandleFunc);
        var notifier = notifierInit;

        function executeHandleFunc(responseData) {
            notifier.notifySuccess(responseData.message, statusCodes.Ok);
        }
    }
})();
