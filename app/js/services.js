'use strict';

/* Services */
var mementoServices = angular.module('humans.services', ['ngResource']);


mementoServices.factory('Login', ['$resource',
  function($resource) {
  return $resource('https://nfl-backend.herokuapp.com/v1/login/test', {}, {
    query: {method:'GET', params:{}, isArray:false}
  });
}]);

mementoServices.factory('Moments', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/moments/filter', {}, {
      get: {method:'GET', params:{}, isArray:false}
    });
  }]);

mementoServices.factory('Humans', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/humans/:id', {id: '@id'}, {
      get: {method:'GET', params:{}, isArray:false},
      create: {method:'POST', params:{}, isArray:false},  
      edit: {method:'PUT', params:{}, isArray:false},
      remove: {method:'DELETE', params:{}, isArray:false}        
    });
  }]);

mementoServices.factory('Places', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/places/:id', {id: '@id'}, {
      get: {method:'GET', params:{}, isArray:false},
      create: {method:'POST', params:{}, isArray:false},  
      edit: {method:'PUT', params:{}, isArray:false},
      remove: {method:'DELETE', params:{}, isArray:false}        
    });
  }]);

mementoServices.factory('Accounts', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/accounts/:id', {id: '@id'}, {
      get: {method:'GET', params:{}, isArray:false},
      create: {method:'POST', params:{}, isArray:false},  
      edit: {method:'PUT', params:{}, isArray:false},
      remove: {method:'DELETE', params:{}, isArray:false}        
    });
  }]);

mementoServices.factory('Mementos', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/mementos/:memento_id', {memento_id: '@memento_id'}, {
      get: {method:'GET', params:{}, isArray:false},
    });
  }]);


mementoServices.factory('HumanMoments', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/humans/:humanId/moments/filter', {humanId: '@id'}, {
      get: {method:'GET', params:{}, isArray:false},
    });
  }]);

mementoServices.factory('HumanMementos', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/humans/:human_id/mementos', {human_id: '@human_id'}, {
      get: {method:'GET', params:{}, isArray:false},
    });
  }]);

mementoServices.factory('HumanPlaces', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/humans/:humanId/places/filter', {humanId: '@humanId'}, {
      get: {method:'GET', params:{}, isArray:false},
    });
  }]);

mementoServices.factory('HumanContacts', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/humans/:human_id/contacts/:contact_id', {human_id: '@human_id'}, {
      get: {method:'GET', params:{}},
      save: {method:'POST', params:{}},
      remove: {method:'DELETE', params:{contact_id: '@contact_id'}}
    });
  }]);

mementoServices.factory('Users', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/users/:username', {username: '@username'}, {
      get: {method:'GET', params:{}, isArray:false},
      create: {method:'POST', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/users/'},
      remove: {method:'DELETE', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/users/:username'},
      edit: {method:'PUT', params:{}, isArray:false,  url: 'https://nfl-backend.herokuapp.com/v1/users/:username'}  
    });
  }]);

mementoServices.factory('Contacts', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/contacts/:contactId', {contactId: '@id'}, {
      get: {method:'GET', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/contacts'},
      save: {method:'POST', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/contacts'},
      search: {method:'GET', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/contacts/search'}      
    });
  }]);



mementoServices.factory('Dispatch', ['$resource',
  function($resource){
    return $resource('http://humans-backend.nearfuturelaboratory.ch/', {}, {
      searchContacts: {method:'GET', params:{}, isArray:false, url: 'http://humans-backend.nearfuturelaboratory.ch/contacts/search'},
      getNewUser: {method:'GET', params:{}, isArray:false, url: 'http://humans-backend.nearfuturelaboratory.ch/users/new'},    
      createHumanMemento: {method:'GET', params:{human_id: '@human_id'}, isArray:false, url: 'http://humans-memento.nearfuturelaboratory.ch/humans/:human_id/memento/create'},
      getHumanMemento: {method:'GET', params:{memento_id: '@memento_id'}, isArray:false, url: 'http://humans-memento.nearfuturelaboratory.ch/mementos/:memento_id'},  
      getSuggestedHumans: {method:'GET', params:{user_id: '@user_id'}, isArray:false, url: 'http://humans-timeline.nearfuturelaboratory.ch/users/:user_id/suggested_humans'}
    });
  }]);

mementoServices.factory('Concierge', ['$resource',
  function($resource){
    return $resource('https://nfl-backend.herokuapp.com/v1/concierge/update/', {}, {
      updateContactMoments: {method:'GET', params:{contact_id: '@contact_id'}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/concierge/update/moments/contact/:contact_id'},
      updateHumanMoments: {method:'GET', params:{human_id: '@human_id'}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/concierge/update/moments/human/:human_id'},
      updateAccountContacts: {method:'GET', params:{account_id: '@account_id'}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/concierge/update/contacts/account/:account_id'},
      updateAccountMoments: {method:'GET', params:{account_id: '@account_id'}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/concierge/update/moments/account/:account_id'},      
      updateUserMoments: {method:'GET', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/concierge/update/moments'},     
      updateUserContacts: {method:'GET', params:{}, isArray:false, url: 'https://nfl-backend.herokuapp.com/v1/concierge/update/contacts'}      
    });
  }]);

mementoServices.factory('TwitterService', ['$timeout', function ($timeout) {
    return {
        load: function () {
        if (typeof twttr === 'undefined') {
            (function() {
                !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
            })();
        } else {
            $timeout = twttr.widgets.load();
        };
        }
    }
}]);


mementoServices.factory('Auth', ['$cookieStore', '$http', 'localStorageService', function ($cookieStore, $http, localStorageService) {
    // initialize to whatever is in the cookie, if anything
    $http.defaults.headers.common['Authorization'] = 'Basic ' + localStorageService.get('authdata');
    var count = false;
    if (localStorageService.get("username")!=null){
      count = true;
    }
    return {
        setCredentials: function (username, password) {
            var encoded = btoa(username + ':' + password);
            $http.defaults.headers.common.Authorization = 'Basic ' + encoded;
            localStorageService.set('username', username);
            localStorageService.set('authdata', encoded);
            count = true;
        },
        clearCredentials: function () {
            console.log("credentials cleared!!!!");
            document.execCommand("ClearAuthenticationCache");
            localStorageService.remove('authdata');
            localStorageService.remove('username');
            $http.defaults.headers.common.Authorization = 'Basic ';
            count = false;
        },
        getCount: function() {
            console.log("called isAuthenticated");
            return count;
        }
    };  
}]);