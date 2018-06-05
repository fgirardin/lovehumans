'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('humans', [
  'ngRoute',
  'ngCookies',
  'ngResource',  
  'ngSanitize',    
  'ngTouch',   
  'ngMaterial',   
  'angularMoment',    
  'LocalStorageModule',
  'humans.filters',
  'humans.services',
  'humans.directives',
  'humans.controllers'
]);


app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider, $httpProvider) {

  $routeProvider.when('/', {templateUrl: 'partials/home.html', controller: 'HomeCtrl'});
  $routeProvider.when('/settings', { templateUrl: 'partials/settings.html', controller: 'SettingsCtrl' });
  $routeProvider.when('/welcome', { templateUrl: 'partials/welcome.html', controller: 'WelcomeCtrl' });
  $routeProvider.when('/connect', { templateUrl: 'partials/connect.html', controller: 'ConnectCtrl' });
  $routeProvider.when('/humans/create', { templateUrl: 'partials/createHuman.html', controller: 'createHumanCtrl' });
  $routeProvider.when('/humans/:humanId/edit', { templateUrl: 'partials/editHuman.html', controller: 'editHumanCtrl' });  
  $routeProvider.when('/humans/:humanId/addContact', { templateUrl: 'partials/addContact.html', controller: 'addContactCtrl' });  
  $routeProvider.when('/humans/:humanId/dispatch/:mementoId', { templateUrl: 'partials/viewMemento.html', controller: 'ViewMementoCtrl' });  
  $routeProvider.when('/access/dispatch/:mementoId/:code', { templateUrl: 'partials/viewMemento.html', controller: 'AccessMementoCtrl' });    
  $routeProvider.when('/auth/callback', { templateUrl: 'partials/accountCallback.html', controller: 'AccountCtrl' });
  $routeProvider.when('/auth/callback-start', { templateUrl: 'partials/accountCallback.html', controller: 'AccountCtrl' });
  //$routeProvider.when('/register', { templateUrl: 'partials/register.html', controller: 'RegisterCtrl' })    
  $routeProvider.when('/login', { templateUrl: 'partials/login.html', controller: 'LoginCtrl' })    
  $routeProvider.when('/logout', { templateUrl: 'partials/start.html', controller: 'LogoutCtrl' });   
  
  $routeProvider.otherwise({redirectTo: '/login'});  

}]).
config(function($httpProvider) {
  $httpProvider.interceptors.push(function($rootScope, $location, $q, localStorageService) {
    return {
      'request': function(request) {
        // if we're not logged-in to the AngularJS app, redirect to login page
        $rootScope.username = localStorageService.get('username');
        $rootScope.loggedIn = $rootScope.loggedIn || $rootScope.username;
        if (!$rootScope.loggedIn && $location.path() != '/login' && $location.path() != '/register' && $location.path().indexOf('/access') == -1) {
          console.log("not logged in!");
          $location.path('/login');       
        }
        return request;
      },
      'responseError': function(rejection) {
        // if we're not logged-in to the web service, redirect to login page
        if (rejection.status === 401 && $location.path() != '/login' && $location.path() != '/register') {
          console.log("not logged in to web services!");
          $rootScope.loggedIn = false;
          $location.path('/login');
        }
        return $q.reject(rejection);         
      }
    };
  });
}).
config(function (localStorageServiceProvider) {
          localStorageServiceProvider
            .setStorageCookie(0, '/')
            .setPrefix('humans');
});

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('grey', {
      'default': '400', // by default use shade 400 from the pink palette for primary intentions
      'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
    })
    .accentPalette('green');
  $mdThemingProvider.theme('docs-dark', 'default')
    .primaryPalette('green').dark(); 
});



