// handlersCollection - add to new handler:
// 1 - addResponseHandler(statusCodeInit, handleFunc,normalizeResponseData);
// 2 - addCoveringRangeResponseHandler(statusCodeFrom, statusCodeTo, handleFunc,normalizeResponseData)
// responseHandlerConfig - set settings for response interceptor and notifier
// 1 - ignoredStatusCodes (array)
// 2 - noramlizeResponseData(responseData)
// 3 - notifySettings(timeOut, animationClass, positionClass, iconClasses) 
// notifier - show message notifySuccess()

(function () {
    'use strict';

    var responseHandlingModule = angular.module("responseHandlingApp", ['toaster']);

    //settings 
    responseHandlingModule.value('responseHandlerConfig', {
        ignoredStatusCodes: [],
        getIgnoredStatusCode: function () {
            return this.ignoredStatusCodes;
        },
        noramlizeResponseData: function (responseData) {
            return responseData;
        },
        notifySettings: function (timeOut, positionClass, iconClasses) {
            return {
                'limit': 0,
                'tap-to-dismiss': true,
                'close-button': false,
                'close-html': '<button class="toast-close-button" type="button">&times;</button>',
                'newest-on-top': true,
                'time-out': timeOut || 3000,
                'icon-classes': iconClasses || {
                    error: 'toast-error',
                    info: 'toast-info',
                    wait: 'toast-wait',
                    success: 'toast-success',
                    warning: 'toast-warning'
                },
                'body-output-type': '', // Options: '', 'trustedHtml', 'template', 'templateWithData', 'directive'
                'body-template': 'toasterBodyTmpl.html',
                'icon-class': 'toast-info',
                'position-class': positionClass || 'toast-top-right', // Options (see CSS):
                // 'toast-top-full-width', 'toast-bottom-full-width', 'toast-center',
                // 'toast-top-left', 'toast-top-center', 'toast-top-right',
                // 'toast-bottom-left', 'toast-bottom-center', 'toast-bottom-right',
                'title-class': 'toast-title',
                'message-class': 'toast-message',
                'prevent-duplicates': false,
                'mouseover-timer-stop': true // stop timeout on mouseover and restart timer on mouseout
            }
        }
    });

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
    notifier.$inject = ['toaster', 'responseHandlerConfig'];
    function notifier(toaster, responseHandlerConfig) {

        var notifierElem = "<toaster-container toaster-options=" +
            "\"" +
            JSON.stringify(responseHandlerConfig.notifySettings) +
            "\"></toaster-container>";

        var rootElem = document.querySelector('[ng-app]');
        angular.element(rootElem).append(notifierElem);

        return {
            notifySuccess: notifySuccess,
            notifyWarning: notifyWarning,
            notifyError: notifyError
        }

        function notifySuccess(message, title) {
            toaster.success(message, title);
        }

        function notifyWarning(message, title, timeout, bodyOutputType, clickHandler, toasterId, showCloseButton, toastId, onHideCallback) {
            toaster.pop('warning', title, message, timeout, bodyOutputType, clickHandler, toasterId, showCloseButton, toastId, onHideCallback);
        }

        function notifyError(message, title) {
            toaster.error(message, title);
        }
    };

    // response Interceptor
    responseHandlingModule.factory('httpResponseInterceptor', ['$rootScope', 'handlersCollection', 'notifier', 'responseHandlerConfig', '$log',
        function ($rootScope, handlersCollection, notifier, responseHandlerConfig, $log) {

            var noramlizeResponseData = responseHandlerConfig.noramlizeResponseData;

            return {
                // for angular config 
                response: function (response) {
                    angularHandler(response);
                },
                responseError: function (response) {
                    angularHandler(response);
                },
                // for jquery ajax config 
                responseJquery: function (event, xhr) {
                    var headersArray = xhr.getAllResponseHeaders();
                    var headers = {};
                    headersArray.split('\n').forEach(function (headerString) {
                        var header = headerString.split(':');
                        if (header[0] && header[0].length > 0) {
                            headers[header[0]] = header[1];
                        }
                    });
                    var responseData = $.parseJSON(xhr.responseText);
                    handlingResponse(xhr.status, responseData, headers);
                    $rootScope.$apply();
                }
            }

            function angularHandler(response) {
                var headers = response.headers();
                handlingResponse(response.status, response.data, headers);
                return response;
            }

            // common handling response
            function handlingResponse(statusCodeStr, responseData, headers) {

                var statusCode = parseInt(statusCodeStr);

                // stop handler if current status code has been added to ignore
                if (isIgnoreStatusCode(statusCode))
                    return;

                var handlers = handlersCollection.getAllHandlers();
                var handler = getHandlerByStatusCode(handlers, statusCode);

                if (handler) {
                    var normalizeResponseData = handler.normalizeResponseData ?
                        handler.normalizeResponseData(responseData) : noramlizeResponseData(responseData);
                    handler.handle(normalizeResponseData, headers, notifier);
                }
            }

            // check status code that it has not ignore 
            function isIgnoreStatusCode(currentStatusCode) {
                var ingnoredStatusCodes = responseHandlerConfig.getIgnoredStatusCode() || [];
                return ingnoredStatusCodes.some(function (statusCode) {
                    return currentStatusCode === statusCode;
                });
            }

            function getHandlerByStatusCode(handlers, statusCode) {
                var filteredHandlers = handlers.filter(function (handler) { return handler.isCanHandle(statusCode); });
                if (filteredHandlers.length > 1) {
                    $log.warn('Status code - ' + statusCode + ' has more than one handler');
                }
                return filteredHandlers[0];
            }
        }]);

    // handlers factory 
    responseHandlingModule.factory('handlersFactory', handlersFactory);
    function handlersFactory() {

        return {
            createCoveringRangeHandler: createCoveringRangeHandler,
            createHandler: createHandler
        }

        function createCoveringRangeHandler(statusCodeFrom, statusCodeTo, handleFunc, normalizeResponseData) {
            var createdHandler = createHandlerObject(handleFunc, normalizeResponseData);
            return angular.extend(createdHandler, {
                isCanHandle: function (statusCode) {
                    if (statusCodeFrom <= statusCode && statusCodeTo >= statusCode) {
                        return true;
                    }
                    return false;
                }
            });
        }
        function createHandler(statusCodeInit, handleFunc, normalizeResponseData) {
            var createdHandler = createHandlerObject(handleFunc, normalizeResponseData);
            return angular.extend(createdHandler, {
                isCanHandle: function (statusCode) {
                    if (statusCodeInit === statusCode) {
                        return true;
                    }
                    return false;
                }
            });
        }

        function createHandlerObject(handleFunc, normalizeResponseData) {
            return {
                handle: handleFunc,
                normalizeResponseData: normalizeResponseData
            }
        }
    }

    // handlers collection 
    responseHandlingModule.factory('handlersCollection', handlersCollection);
    handlersCollection.$inject = ['handlersFactory'];
    function handlersCollection(handlersFactory) {

        var statusCodes = {
            BadRequest: 400,
            Unauthorized: 401,
            NotFound: 404,
            InternalServerError: 500
        }

        var handlers = [];

        handlers.push(handlersFactory.createHandler(statusCodes.BadRequest,
            function (responseData, headers, notifier) {
                notifier.notifyWarning(responseData);
            }));

        handlers.push(handlersFactory.createHandler(statusCodes.NotFound,
            function (responseData, headers, notifier) {
                notifier.notifyWarning("Current page is not found");
            }));

        handlers.push(handlersFactory.createHandler(statusCodes.Unauthorized,
            function (responseData, headers) {
                var unauthorizedResponseHeader = 'x-responded-json';

                if (headers[unauthorizedResponseHeader] !== undefined) {
                    var xheader = headers[unauthorizedResponseHeader];
                    var obj = JSON.parse(xheader);
                    var location = obj.headers.location;
                    var index = location.indexOf('?');
                    var currentLocation = location.substring(0, index);
                    document.location = currentLocation;
                }
            }));

        handlers.push(handlersFactory.createHandler(statusCodes.InternalServerError,
           function (responseData, headers, notifier) {
               notifier.notifyError(responseData);
           }));

        return {
            addResponseHandler: addResponseHandler,
            addCoveringRangeResponseHandler: addCoveringRangeResponseHandler,
            getAllHandlers: getAllHandlers
        }

        function addResponseHandler(statusCodeInit, handleInit) {
            handlers.push(handlersFactory.createHandler(statusCodeInit, handleInit));
        }

        function addCoveringRangeResponseHandler(statusCodeFrom, statusCodeTo, handleInit) {
            handlers.push(handlersFactory.createCoveringRangeHandler(statusCodeFrom, statusCodeTo, handleInit));
        }

        function getAllHandlers() {
            return handlers;
        }
    }
})();
