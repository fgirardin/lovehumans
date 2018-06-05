var app = angular.module('StarterApp', ['ngMaterial', 'ngResource', 'humans.services', 'angularMoment', 'ngSanitize']);

app.controller('AppCtrl', ['$scope', function($scope){
 
}]);

app.controller('HomeCtrl', ['$scope', '$http', 'Login', 'Humans', 'HumanMementos', function($scope, $http, Login, Humans, HumanMementos){

}]);

app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('grey', {
      'default': '400', // by default use shade 400 from the pink palette for primary intentions
      'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
      'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
      'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
    })
    .accentPalette('green');
});