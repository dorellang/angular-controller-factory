'use strict';
describe('controllerFactory', function(){

  describe('vanilla API', function(){
    function Foo($http, $location){
      this.inject1 = $http;
      this.inject2 = $location;
      this.bar = 0;
    }
    Foo.prototype.foo = function(){
      return 42;
    };
    Foo.prototype.bar = 69;

    function Bar(service){
      this.bar = 'helloworld';
      this.service = service;
    }
    Bar.$inject = ['$rootScope'];

    function assertFoo(foo, service1, service2){
      expect(foo.bar).toBe(0);
      expect(foo.foo()).toBe(42);
      expect(Object.getPrototypeOf(foo)).toBe(Foo.prototype);
      expect(foo.inject1).toBe(service1);
      expect(foo.inject2).toBe(service2);
    }

    function assertBar(bar, service){
      expect(bar.bar).toBe('helloworld');
      expect(bar.service).toBe(service);
    }

    it('should handle vanilla ctrl registration', function(){
      module('dorellang.controllerFactory', function($controllerProvider){
        $controllerProvider.register('Foo', Foo);
      });
      inject(function($controller, $http, $location){
        var foo = $controller('Foo');
        assertFoo(foo, $http, $location);
      });
    });

    it('should handle vanilla ctrl registration with array annotation', function(){
      module('dorellang.controllerFactory', function($controllerProvider){
        $controllerProvider.register('Foo', ['$location', '$filter', Foo]);
      });
      inject(function($controller, $location, $filter){
        var foo = $controller('Foo');
        assertFoo(foo, $location, $filter);
      });
    });

    it('should handle vanilla ctrl registration with $inject annotation', function(){
      module('dorellang.controllerFactory', function($controllerProvider){
        $controllerProvider.register('Bar', Bar);
      });
      inject(function($controller, $rootScope){
        var bar = $controller('Bar');
        assertBar(bar, $rootScope);
      });
    });

    it('should handle vanilla ctrl registration with object', function(){
      module('dorellang.controllerFactory', function($controllerProvider){
        $controllerProvider.register({
          Foo: Foo,
          Bar1: Bar,
          Bar2: ['$parse', Bar]
        });
      });
      inject(function($controller, $http, $location, $rootScope, $parse){
        var foo = $controller('Foo');
        assertFoo(foo, $http, $location);
        var bar1 = $controller('Bar1');
        assertBar(bar1, $rootScope);
        var bar2 = $controller('Bar2');
        assertBar(bar2, $parse);
      });
    });
  });

  describe('inheritance API', function(){
    function Parent($http, $location){
      this.service1 = $http;
      this.service2 = $location;
    }
    Parent.prototype.hola = function(){
      return 'holamundo';
    };

    it('should handle simple ctrl factory registration', function(){
      module('dorellang.controllerFactory', function($controllerProvider){
        $controllerProvider.registerFactory('Child', function(Parent, $injector){
          function Child($parse){
            $injector.invoke(Parent, this);
            this.service1 = $parse;
          }
          Child.prototype = Object.create(Parent.prototype);
          Child.prototype.chao = function(){
            return 'adiosmundocruel';
          };
          return Child;
        });
        $controllerProvider.register('Parent', Parent);
      });
      inject(function($controller, $parse, $location){
        var child = $controller('Child');
        expect(child instanceof Parent).toBeTruthy();
        expect(child.hola()).toBe('holamundo');
        expect(child.chao()).toBe('adiosmundocruel');
        expect(child.service1).toBe($parse);
        expect(child.service2).toBe($location);
      });
    });

    it('should handle complex ctrl factory chain', function(){
      module('dorellang.controllerFactory', function($controllerProvider){
        $controllerProvider.registerFactory('Child', function(Parent, $injector){
          function Child($parse){
            $injector.invoke(Parent, this);
            this.service1 = $parse;
          }
          Child.prototype = Object.create(Parent.prototype);
          Child.prototype.chao = function(){
            return 'adiosmundocruel';
          };
          return Child;
        });
        $controllerProvider.registerFactory('GrandChild', function(Child){
          function GrandChild($injector){
            $injector.invoke(Child, this);
            this.service2 = $injector;
          }
          GrandChild.prototype = Object.create(Child.prototype);
          GrandChild.prototype.hola = function(){
            return 'helloworld';
          };
          return GrandChild;
        });
        $controllerProvider.register('Parent', Parent);
      });
      inject(function($controller, $parse, $injector){
        var grandChild = $controller('GrandChild');
        expect(grandChild instanceof Parent).toBeTruthy();
        expect(grandChild.hola()).toBe('helloworld');
        expect(grandChild.chao()).toBe('adiosmundocruel');
        expect(grandChild.service1).toBe($parse);
        expect(grandChild.service2).toBe($injector);
      });
    });
  });

  describe('angular.module shortcut', function(){
    it('should forward to $controllerProvider.registerFactory', function(){
      var ctrlProvider;
      function dummy(){}
      module('dorellang.controllerFactory', function($controllerProvider){
        spyOn($controllerProvider, 'registerFactory');
        ctrlProvider = $controllerProvider;
      }, 'test');
      angular.module('test', [])
        .controllerFactory('TestCtrl', dummy);
      inject(dummy);
      expect(ctrlProvider.registerFactory).toHaveBeenCalledWith('TestCtrl', dummy);
    });
  });
});