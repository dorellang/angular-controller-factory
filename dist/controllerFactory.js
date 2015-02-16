'use strict';
// Source: src/controllerFactory.js
(function(){
  var ngModule = angular.module;
  angular.module = function(){
    var module = ngModule.apply(this, arguments);
    if(angular.isObject(module) && module.controllerFactory === undefined){
      module.controllerFactory = function(){
        var args = arguments;
        this.config(["$controllerProvider", function($controllerProvider){
          $controllerProvider.registerFactory.apply($controllerProvider, args);
        }]);
        return this;
      };
    }
    return module;
  };
})();

angular.module('dorellang.controllerFactory', [])
  .config(["$controllerProvider", "$provide", function($controllerProvider, $provide){
    var controllers = {};

    var $super = $controllerProvider.register;
    $controllerProvider.register = function(controllerName, controller){
      if(angular.isObject(controllerName)){
        angular.extend(controllers, controllerName);
      } else {
        controllers[controllerName] = controller;
      }
      return $super.apply(this, arguments);
    };

    $controllerProvider.registerFactory = function(controllerName, controllerFactory){
      pendingController.$constructorFactory = controllerFactory;
      pendingController.$pending = true;
      controllers[controllerName] = pendingController;
      arguments[1] = pendingController;
      return $super.apply(this, arguments);

      function pendingController(){
        /* jshint validthis: true */
        var result = pendingController.$constructor.apply(this, arguments);
        if((angular.isObject(result) || angular.isFunction(result)) &&
            result !== this){
          return result;
        }
      }
    };

    $provide.decorator('$controller', ["$delegate", "$injector", function($delegate, $injector){
      return function (controllerName){
        initController(controllerName);
        return $delegate.apply(this, arguments);
      };

      function initController(controllerName){
        /* jshint validthis: true */
        var controller;
        if(typeof controllerName === 'string' &&
            (controller = controllers[controllerName]) !== undefined &&
            controller.$pending){
          var factoryInjectables = $injector.annotate(controller.$constructorFactory);
          angular.forEach(factoryInjectables, function(injectable){
            if(injectable in controllers){
              initController(injectable);
            }
          });
          controller.$constructor = $injector.invoke(
            controller.$constructorFactory, this, controllers
          );
          controller.prototype = controller.$constructor.prototype;
          controller.$inject = $injector.annotate(controller.$constructor);
          controller.$pending = false;
        }
        return controller;
      }
    }]);
  }]);
