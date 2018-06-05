'use strict';

/* Controllers */

angular.module('humans.controllers', [])

  .controller('HomeCtrl', ['$scope', '$rootScope', '$routeParams', '$location', '$anchorScroll', 'Auth', 'Login', 'Users', 'Humans', 'Accounts', 'Contacts', 'HumanContacts', 'Dispatch', 'HumanMementos', function($scope, $rootScope, $routeParams, $location, $anchorScroll, Auth, Login, Users, Humans, Accounts, Contacts, HumanContacts, Dispatch, HumanMementos) {

    $scope.user = null;
    $scope.accounts = undefined;
    $scope.loading = true;
    $scope.suggestedHumans = null;
    $scope.currentTime = new Date();
    $scope.nbHumans = -1;
    $scope.nbLoadedHumans = 0;

    $scope.getUser = function () {
      Users.get({username: $rootScope.username}, function(response) {
          $scope.user = response.data;
          $scope.getHumans();
          $scope.getSuggestedHumans();
      });
    };

    $scope.getSuggestedHumans = function() {
      Dispatch.getSuggestedHumans({user_id: $scope.user.id}, function(response) {
          $scope.suggestedHumans = response;
          console.log(response);
      });
    };
 

    $scope.getHumans = function () {
      Humans.get({}, function(response) {
        $rootScope.humans = response.data;
        if ($rootScope.humans != undefined){
          $scope.nbHumans = $scope.humans.length;
          for (var i= 0; i < $scope.humans.length; i++){
              $scope.getHumanMementos($scope.humans[i]);
          }          
        } else {
          $rootScope.humans = [];
          $scope.loading = false;
        }
      });      
    };    


    $scope.getHumanMementos = function (human) {
      HumanMementos.get({human_id: human.id, per_page: 1}, function(response) {
        if (response.data != undefined){
          human.memento = response.data[0];
          human.memento.data = JSON.parse(human.memento.data);
          human.memento.activityStatus = $scope.activityStatus(human.memento.data.chapters);
          console.log(human);
        } else {
          human.memento = {description: "We should be done soon sanitizing and mostering each element of the feed of "+human.name+"."};
        }
        $scope.nbLoadedHumans ++;
        if ($scope.nbLoadedHumans == $scope.nbHumans){
          //Find the most recent Human update
          //1. order the humans
          $rootScope.humans.sort(compareHumans);
          $scope.loading = false;            
        }
      });
    };      

    $scope.activityStatus = function(chapters){
      var recentUpdates = $scope.recentUpdates(chapters);
      if (recentUpdates.length == 0){
        return "Inactive";
      } else if (recentUpdates.length == 1){
        return "Calm";
      } else if (recentUpdates.length > 1 && recentUpdates.length < 5){
        return "Active";
      } else {
        return "Busy"
      }
    }

    $scope.recentUpdates = function (chapters){
      var recentUpdates = [];

      var d = new Date();
      d = new Date(d.toUTCString());
      d.setDate(d.getDate() - 1);
      var yesterday = d.toISOString();
      for (var i = chapters.length - 1; i >= 0; i--) {
        var chapter = chapters[i];
        for (var j = chapter.moments.length - 1; j >= 0; j--) {
          var moment = chapter.moments[j];
          if (moment.created_at > yesterday){
            recentUpdates.push(moment);
          }
        }
      }
      return recentUpdates;
    };

    $scope.setEdit = function (value){
      $scope.edit = value;
    }

    $scope.createHuman = function () {
      $location.path("/humans/create");
    };   


    $scope.createHumanWithSuggestion = function (human) {
      console.log("create a new human from a suggestion");
      Humans.create({user_id:$scope.user.id, name: human.name}, function(response, getResponseHeaders) {
          console.log(response);
          //fetch the id of the newly created human
          var location = getResponseHeaders()['location'];
          var elements = location.split("/");
          human.id = elements[elements.length-1];   

          //add the contacts to the human
          for (var i= 0; i < human.all_contacts.length; i++){
            var contact = human.all_contacts[i];
            $scope.addContactToHuman(human.id, contact, i, human.all_contacts.length);
          }
          var filter = null;
          if (human.type != 'normal'){
            filter = human.name;
          }
      });
    };  

    $scope.removeHuman = function (human) {
      Humans.remove({id: human.id}, function(response) {
            $scope.getHumans();
      }); 
    };       


    $scope.addContactToHuman = function (human_id, contact, index, nbContacts) {
        Contacts.save({account_id: contact.account_id, contact_type_id: contact.contact_type.id, account_uid: contact.account_uid, email: contact.email, fullname: contact.fullname, username: contact.username, profile_picture_url: contact.profile_picture_url}, function(response, getResponseHeaders) {
          console.log(response);
          //retrieve the new contact id;
          var location = getResponseHeaders()['location'];
          var elements = location.split("/");
          var contact_id = parseInt(elements[elements.length-1]);  

          HumanContacts.save({human_id: human_id, contact_id: contact_id}, function(response) {
              console.log(response);
              if (index == nbContacts-1){
                $scope.loading = true;
                $location.path('/humans/'+human_id+'/dispatch/undefined');
              }
          });        
        });        
    };        

    $scope.goToDispatch = function (human){
      $location.path('/humans/'+human.id+'/dispatch/'+human.memento.id);
    }


    /*
    * Util functions
    * 
    */

    function compareHumans(a,b) {
      if (a.memento == undefined)
         return 1;
      if (b.memento == undefined)
          return -1;      
      if (a.memento.end_period_at == undefined)
         return 1;
      if (b.memento.end_period_at == undefined)
          return -1;
      if (a.memento.end_period_at > b.memento.end_period_at)
        return -1;
      if (a.memento.end_period_at < b.memento.end_period_at)
        return 1;
      return 0;
    }
   

    $scope.getUser();

  }])  

  .controller('ViewMementoCtrl', function ($scope, $rootScope, $routeParams, $location, $timeout, Mementos, Humans, HumanContacts, HumanMementos, Dispatch) {

    $scope.memento_id = $routeParams.mementoId;
    $scope.human_id = $routeParams.humanId;
    $scope.access_code = $routeParams.code;
    $scope.memento = null;
    $scope.message = "";
    $scope.updating = true;

    $scope.getHuman = function () {
      Humans.get({id: $scope.human_id}, function(response) {
          console.log(response);
          $scope.human = response.data;
          //get the list of contacts
          HumanContacts.get({human_id: $scope.human.id}, function(response) {
            console.log(response);
            if (response.total_results == 0){
              var elements = [];
              $scope.human.contacts = {elements: elements};
            } else {
              $scope.human.contacts.elements = response.data;
            }
          });             
      });      
    };   

    $scope.getMemento = function(){
      Mementos.get({memento_id: $scope.memento_id}, function(success){
        $scope.memento = success.data;
        $scope.memento.data = JSON.parse($scope.memento.data);
        $scope.updating = false;
        console.log($scope.memento);
      }, function(error){
        $scope.message = "Dispatch not found";
        $scope.updating = false;
      });          
    } 

    $scope.getRecentMemento = function() {
        $rootScope.humans = [];
        HumanMementos.get({human_id: $scope.human_id, per_page: 1}, function(response) {
          if (response.data != undefined){
            $scope.memento = response.data[0];
            $scope.memento.data = JSON.parse($scope.memento.data);
            $scope.updating = false;
          } else {
            $scope.createMemento();
          }
        });      
    }

    $scope.createMemento = function(){
      console.log("createMemento");
      Dispatch.createHumanMemento({human_id: $scope.human_id}, function(success){
        HumanMementos.get({human_id: $scope.human_id, per_page: 1}, function(response) {
          if (response.data != undefined){
            $scope.memento = response.data[0];
            $scope.memento.data = JSON.parse($scope.memento.data);
            $scope.updating = false;
          } else {
            $scope.message = "Could not create dispatch";
            $scope.updating = false;            
          }
        });
      }, function(error){
        $scope.message = "Dispatch not found";
        $scope.updating = false;
      });          
    }     

    $scope.prepareLayout = function (moments){
      for (var i = moments.length - 1; i >= 0; i--) {
        var moment = moments[i];
        if (moment.description == undefined){
          if (moment.name != undefined){
            moment.description = moment.name;
            moment.pretty_description = moment.name;
          } else {
            moment.description = "";
            moment.pretty_description = "";
            moment.name = "";
          }
        }

        if (moment.pretty_description == undefined){
          moment.pretty_description = moment.description;
        }

        $scope.prettyRT(moment);
        moment.longText = false;
        moment.hasImage = false;
        moment.personal = false;
        if (moment.pretty_description.length > 60){
          moment.longText = true;
        }
        if (moment.photos != undefined){
          moment.hasImage = true;
        }
        if (moment.author == undefined){
          moment.personal = true;
        }

        if (moment.hasImage  && !moment.longText){
          moment.span  = { row : 2, col : 2 };
          moment.format = 'image';
        } else if (moment.longText && !moment.hasImage){
          moment.span  = { row : 2, col : 2 };
          moment.format = 'longdescription';
        } else if (moment.longText && moment.hasImage){
          moment.span  = { row : 2, col : 4 };        
          moment.format = 'imagedescription';        
        } else {
          moment.span  = { row : 2, col : 2 };
          moment.format = 'shortdescription';
        }     

        if (moment.pretty_description.length > 120){   
          moment.span.row++;
        }

        if (moment.pretty_description.length > 300){   
          moment.span.row++;
        } 
      };

      if (moments.length == 2){
         if (moments[0].span.col == 2 && moments[1].span.col == 2){
           moments[0].span.col = 3;
           moments[1].span.col = 3;
           if (moment.format == 'image'){
             moments[0].span.row = 3;
             moments[1].span.row = 3;
           }           
         }
      } else if (moments.length == 1){
        if (moments[0].format == 'image'){
          moments[0].span.row = 3;
        }
      }   




      return moments;

    }

    $scope.goToEdit = function (){
      $location.path('/humans/'+$scope.human.id+"/edit");
    }


    $scope.selectMoment = function (moment){
      if (moment.selected){
        moment.selected = undefined;
      } else {
        moment.selected = true;
        /*
        if (moment.account.account_type.name == 'Twitter'){
          Dispatch.getTwitterOembed({url: moment.url, hide_media: true, hide_thread: true, omit_script: true}, function(success){
            console.log(success);
            $timeout(function () {
              twttr.widgets.load();
            }, 30);            
            moment.embed = {html: success.html};
          });  
        } else if (moment.account.account_type.name == 'Instagram'){
          Dispatch.getInstagramOembed({url: moment.url}, function(success){
            console.log(success);
            moment.embed = {html: success.html};
          });  
        }
        */
      }
    }


    $scope.getTitle = function (group){
      if (group != undefined){
        if (group.type == "period" || group.type == "main"){
          for (var i = 0; i < group.moments.length; i++) {
            var moment = group.moments[i];
            return moment.created_at;
          };
        } else {
          return group.name;
        }        
      }
    }; 

    $scope.getGroupMapUrl = function(group){
      var nbPlaces = 0;
      var place = null;
      var url = 'https://api.tiles.mapbox.com/v4/fgirardin.map-rxmaard1/';
      for (var i = 0; i < group.moments.length; i++) {
        if (group.moments[i].place != undefined){
          if (place != null){
            if (place.id != group.moments[i].place.id){
              nbPlaces++;
            }          
          } else {
            nbPlaces++;
          }
           place = group.moments[i].place;
           var pin_id = i+1;
           url = url + "pin-l-"+pin_id+"("+place.longitude+","+place.latitude+"),";
        }
      }
      url = url.substring(0, url.length - 1);
      if (nbPlaces > 0){
        if (nbPlaces == 1){
          url = url +"/"+place.longitude+","+place.latitude+",10/740x260.png?access_token=pk.eyJ1IjoiZmdpcmFyZGluIiwiYSI6IktabUd4X28ifQ.Xp54fg5Mk94v0uPelnUkKg";          
        } else {
          url = url +"/auto/1280x260.png?access_token=pk.eyJ1IjoiZmdpcmFyZGluIiwiYSI6IktabUd4X28ifQ.Xp54fg5Mk94v0uPelnUkKg";
        }

        return url;
      } 
      return undefined;
    };   



    $scope.prettyRT = function(moment){
      if (moment.pretty_description != undefined){
        if (moment.pretty_description.indexOf('RT') === 0){
          moment.author = moment.pretty_description.substring(3, moment.pretty_description.indexOf(':'))
          moment.pretty_description = moment.pretty_description.substring(moment.pretty_description.indexOf(':')+1);
        }
      }
    }        

    $scope.goToMemento = function (){
      //find the index
      for (var i = $rootScope.humans.length - 1; i >= 0; i--) {
        var h = $rootScope.humans[i];
        if (h.id == $scope.human_id){
          $scope.humanIndex = i;
          $scope.human = $rootScope.humans[$scope.humanIndex];
          $scope.memento = $scope.human.memento;
          $scope.updating = false;
        }
      };
    }    

    $scope.goHome = function (){
      $location.path("/");
    }        

    $scope.goNextHuman = function () {
      if($rootScope.humans.length > 0){
         if ($scope.humanIndex == $rootScope.humans.length-1){
          $scope.humanIndex = 0;
         } else {
          $scope.humanIndex++;
         }
        $scope.human = $rootScope.humans[$scope.humanIndex];       
        $scope.memento = $scope.human.memento;
      }
    }

    $scope.goPreviousHuman = function () {
      if($rootScope.humans.length > 0){
        if ($scope.humanIndex == 0){
          $scope.humanIndex = $rootScope.humans.length-1;
        } else {
          $scope.humanIndex--;
         }
        $scope.human = $rootScope.humans[$scope.humanIndex];
        $scope.memento = $scope.human.memento;
      }
    }                


    if ($scope.memento_id != 'undefined' && $rootScope.humans != undefined){
      //$scope.getMemento();     
      $scope.goToMemento();
    } else {
      $scope.getRecentMemento();
    }
    $scope.getHuman();        

  })

  .controller('AccessMementoCtrl', function ($scope, $rootScope, $routeParams, $location, Dispatch) {

    $scope.memento_id = $routeParams.mementoId;
    $scope.access_code = $routeParams.code;
    $scope.memento = null;
    $scope.message = "";
    $scope.updating = true;
    $rootScope.humans = [];


    $scope.getMemento = function(){
      Dispatch.getHumanMemento({memento_id: $scope.memento_id, code: $scope.access_code}, function(success){
        $scope.memento = success.data;
        $scope.memento.data = JSON.parse($scope.memento.data);
        $scope.updating = false;
        console.log($scope.memento);
      }, function(error){
        $scope.message = "Dispatch not found";
        $scope.updating = false;
      });          
    } 


    $scope.prepareLayout = function (moments){
      for (var i = moments.length - 1; i >= 0; i--) {
        var moment = moments[i];
        if (moment.description == undefined){
          if (moment.name != undefined){
            moment.description = moment.name;
            moment.pretty_description = moment.name;
          } else {
            moment.description = "";
            moment.pretty_description = "";
            moment.name = "";
          }
        }

        if (moment.pretty_description == undefined){
          moment.pretty_description = moment.description;
        }

        $scope.prettyRT(moment);
        moment.longText = false;
        moment.hasImage = false;
        moment.personal = false;
        if (moment.pretty_description.length > 60){
          moment.longText = true;
        }
        if (moment.photos != undefined){
          moment.hasImage = true;
        }
        if (moment.author == undefined){
          moment.personal = true;
        }

        if (moment.hasImage  && !moment.longText){
          moment.span  = { row : 2, col : 2 };
          moment.format = 'image';
        } else if (moment.longText && !moment.hasImage){
          moment.span  = { row : 2, col : 2 };
          moment.format = 'longdescription';
        } else if (moment.longText && moment.hasImage){
          moment.span  = { row : 2, col : 4 };        
          moment.format = 'imagedescription';        
        } else {
          moment.span  = { row : 2, col : 2 };
          moment.format = 'shortdescription';
        }     

        if (moment.pretty_description.length > 120){   
          moment.span.row++;
        }

        if (moment.pretty_description.length > 300){   
          moment.span.row++;
        }              
      };

      if (moments.length == 2){
         if (moments[0].span.col == 2 && moments[1].span.col == 2){
           moments[0].span.col = 3;
           moments[1].span.col = 3;
           if (moment.format == 'image'){
             moments[0].span.row = 3;
             moments[1].span.row = 3;
           }
         }
      } else if (moments.length == 1){
        if (moments[0].format == 'image'){
          moments[0].span.row = 3;
        }
      }    

      return moments;

    }



    $scope.selectMoment = function (moment){
      if (moment.selected){
        moment.selected = undefined;
      } else {
        moment.selected = true;
      }
    }


    $scope.getTitle = function (group){
      if (group != undefined){
        if (group.type == "period" || group.type == "main"){
          for (var i = 0; i < group.moments.length; i++) {
            var moment = group.moments[i];
            return moment.created_at;
          };
        } else {
          return group.name;
        }        
      }
    }; 

    $scope.getGroupMapUrl = function(group){
      var nbPlaces = 0;
      var place = null;
      var url = 'https://api.tiles.mapbox.com/v4/fgirardin.map-rxmaard1/';
      for (var i = 0; i < group.moments.length; i++) {
        if (group.moments[i].place != undefined){
          if (place != null){
            if (place.id != group.moments[i].place.id){
              nbPlaces++;
            }          
          } else {
            nbPlaces++;
          }
           place = group.moments[i].place;
           var pin_id = i+1;
           url = url + "pin-l-"+pin_id+"("+place.longitude+","+place.latitude+"),";
        }
      }
      url = url.substring(0, url.length - 1);
      if (nbPlaces > 0){
        if (nbPlaces == 1){
          url = url +"/"+place.longitude+","+place.latitude+",10/740x260.png?access_token=pk.eyJ1IjoiZmdpcmFyZGluIiwiYSI6IktabUd4X28ifQ.Xp54fg5Mk94v0uPelnUkKg";          
        } else {
          url = url +"/auto/1280x260.png?access_token=pk.eyJ1IjoiZmdpcmFyZGluIiwiYSI6IktabUd4X28ifQ.Xp54fg5Mk94v0uPelnUkKg";
        }

        return url;
      } 
      return undefined;
    };   



    $scope.prettyRT = function(moment){
      if (moment.pretty_description != undefined){
        if (moment.pretty_description.indexOf('RT') === 0){
          moment.author = moment.pretty_description.substring(3, moment.pretty_description.indexOf(':'))
          moment.pretty_description = moment.pretty_description.substring(moment.pretty_description.indexOf(':')+1);
        }
      }
    }           

    $scope.goHome = function (){
      $location.path("/");
    }        

    $scope.goToEdit = function (){
      $location.path('/humans/'+$scope.human.id+"/edit");
    }            


    $scope.getMemento();     

  })



  .controller('AccountCtrl', ['$scope', '$rootScope', '$location',  'Accounts', 'Users', 'Dispatch', function($scope, $rootScope, $location, Accounts, Users, Dispatch) {
    console.log("AccountCtrl");
    $scope.code = ($location.search().token);
    $scope.secret = ($location.search().secret);
    $scope.user_id = ($location.search().account_uid);
    $scope.user_profile_picture = ($location.search().user_photo_url);
    $scope.user_username = ($location.search().user_nickname);
    $scope.user_fullname = ($location.search().user_fullname);
    $scope.account_type_id = parseInt($location.search().account_type_id);
    $scope.domain = ($location.search().domain);

    $scope.redirectPath = "/settings";
    if ($scope.domain == 'connect'){
      $scope.redirectPath = "/connect";
    }


    Users.get({username: $rootScope.username}, function(success){
        $scope.user = success.data;

        //get the user accounts
        Accounts.get({}, function (response){
            $scope.accounts = response.data;
            var exists = false;
            if (response.data != undefined){
              for (var i = 0; i < $scope.accounts.length; i++){
                var account = $scope.accounts[i];
                  //check if account_uid and account_type_id are not equal
                  if (account.account_uid == $scope.user_id && account.account_type.id == $scope.account_type_id){
                    exists = true;
                    console.log("account exists already");
                  }
              }
            }

            if (!exists){
             //if does not exist yet, save the account...
              var account = {user_id: $scope.user.id, account_type_id: $scope.account_type_id, account_uid: $scope.user_id, token: $scope.code, secret: $scope.secret, user_photo_url: $scope.user_profile_picture, user_fullname: $scope.user_fullname, user_nickname: $scope.user_username};
                Accounts.create(account, function(response, getResponseHeaders){
                  Dispatch.getSuggestedHumans({user_id: $scope.user.id, refresh: 'true'}, function(response){
                      //called refresh on the timeline... that's all
                      $location.path($scope.redirectPath);
                  });
                });              
            } else {
              $location.path($scope.redirectPath);
            }
        });
      });

  }])  

  .controller('createHumanCtrl', function ($scope, $rootScope, $location, Humans, Users) {
    $scope.human_name = "";
    $scope.error_message = "";

    $scope.getUser = function () {
      Users.get({username: $rootScope.username}, function(response) {
          $scope.user = response.data;
      });
    };    

    $scope.createHuman = function () {
      if ($scope.human == ""){
        $scope.error_message = "The Human name cannot be empty";
      } else {
        Humans.create({user_id:$scope.user.id, name:$scope.human_name}, function(response, getResponseHeaders) {
            console.log(response);
            //fetch the id of the newly created human
            var location = getResponseHeaders()['location'];
            var elements = location.split("/");
            var human_id = elements[elements.length-1];   
            $location.path('/humans/'+human_id+"/edit").search({edit: 'true'});   
        });
      }
    };

    $scope.getUser();       
 
  })

  .controller('editHumanCtrl', function ($scope, $routeParams, $location, Humans, HumanContacts) {
    $scope.human_id = $routeParams.humanId;

    $scope.getHuman = function () {
      Humans.get({id: $scope.human_id}, function(response) {
          console.log(response);
          $scope.human = response.data;
          //get the list of contacts
          HumanContacts.get({human_id: $scope.human.id}, function(response) {
            console.log(response);
            if (response.total_results == 0){
              var elements = [];
              $scope.human.contacts = {elements: elements};
            } else {
              $scope.human.contacts.elements = response.data;
            }
          });             
      });      
    }; 

    $scope.saveHuman = function () {
      Humans.edit({id: $scope.human.id, name: $scope.human.name}, function(response) {
          console.log(response);
          //update the human
          $scope.goToDispatch();
        });
    }

    $scope.removeHuman = function (){
        Humans.remove({id: $scope.human_id}, function(response) {
            //all done move home
            $location.path("/");
        });               
    };

    $scope.removeContact = function (contact) {
      HumanContacts.remove({human_id: $scope.human.id, contact_id: contact.id}, function(response) {
          console.log(response);
          //update the human
          $scope.getHuman();
      });
    };

    $scope.addContact = function () {
      $location.path("/humans/"+$scope.human_id+"/addContact");
    };

    $scope.goToDispatch = function (human){
      $location.path('/humans/'+$scope.human_id+'/dispatch/undefined');
    }


    $scope.getHuman();
 
  })

  .controller('addContactCtrl', function ($scope, $rootScope, $routeParams, $location, Humans, HumanContacts, Users, Dispatch, Contacts) {
     $scope.human_id = $routeParams.humanId;
     $scope.contactSearchTerm = "";
     $scope.searching = false;

    $scope.getUser = function () {
      Users.get({username: $rootScope.username}, function(response) {
          $scope.user = response.data;
          $scope.getHuman();
      });
    };       

    $scope.getHuman = function () {
      Humans.get({id: $scope.human_id}, function(response) {
          console.log(response);
          $scope.human = response.data;
          //$scope.contactSearchTerm = $scope.human.name;
          //$scope.searchAllContacts();       
          //$scope.contactSearchTerm = "";
      });      
    }; 

    $scope.searchAllContacts = function () {
        $scope.searching = true;
        $scope.contacts = [];
        Dispatch.searchContacts({user_id: $scope.user.id, q: $scope.contactSearchTerm}, function(response) {
            console.log(response);
            $scope.contacts = response.data;
            $scope.searching = false;
        });
    };    

    $scope.addContact = function (contact){   
    //check if it exists already in the database...
      var foundContact = undefined;
      var myContact = undefined;
      Contacts.search({q: contact.username}, function(response) {
          console.log(response);
          if (response.data != undefined){
            var contacts = response.data;
            for (var i = contacts.length - 1; i >= 0; i--) {
              myContact = contacts[i];
              console.log("check");
              console.log(myContact.account_uid);
              console.log(contact.account_uid);
              if (myContact.account_uid == contact.account_uid){
                foundContact = myContact;
              }
            };
          }
          if (foundContact!=undefined){
            console.log("found");
            $scope.saveHumanContact(foundContact);            
          } else {
            console.log("not found");
            $scope.createContactAndSave(contact);            
          }
      });
    };    

    $scope.saveHumanContact = function (contact){  
      HumanContacts.save({human_id: $scope.human_id, contact_id: contact.id}, function(response) {
        console.log(response);
        $location.path("/humans/"+$scope.human_id+"/edit");
      }); 
    }

    $scope.createContactAndSave = function (contact){      
     Contacts.save({account_id: contact.account_id, contact_type_id: contact.contact_type.id, account_uid: contact.account_uid, email: contact.email, fullname: contact.fullname, username: contact.username, profile_picture_url: contact.profile_picture_url}, function(response, getResponseHeaders) {
          console.log(response);
          //retrieve the new contact id;
          var location = getResponseHeaders()['location'];
          var elements = location.split("/");
          var contact_id = parseInt(elements[elements.length-1]);  
          HumanContacts.save({human_id: $scope.human_id, contact_id: contact_id}, function(response) {
              console.log(response);
              $location.path("/humans/"+$scope.human_id+"/edit");

          });        
        });       
    }

    $scope.cancel = function () {
      $location.path("/humans/"+$scope.human_id+"/edit");
    }



    $scope.getUser();
  })


  .controller('SettingsCtrl', function ($scope, $rootScope, $location, Accounts, Users, Dispatch) {
    $scope.loading = true;
    $scope.getAccounts = function () {    
      Accounts.get({}, function (response){
          if (response.data != undefined){
            $scope.accounts = response.data;            
          } else {
            $scope.accounts = [];
          }
          $scope.loading = false;
      });      
    };

    $scope.getUser = function () {
      Users.get({username: $rootScope.username}, function(response) {
          $scope.user = response.data;
      });
    };    

    $scope.removeAccount = function (account) {
      console.log(account);
      Accounts.remove({id: account.id}, function(response) {
          //update the accounts
          $scope.getAccounts();
          Dispatch.getSuggestedHumans({user_id: $scope.user.id, refresh: 'true'}, function(response){
              //called refresh on the timeline... that's all
          });          
      });
    };  

    $scope.removeUser = function (){
      Users.remove({username: $scope.user.username}, function(response){
          $location.path("/logout");
      });
    };

    $scope.getAccounts();
    $scope.getUser();
  })



  .controller('LoginCtrl', function ($scope, $rootScope, $location, Auth, Login) {
    $scope.user = {username: '', password: ''};
    $scope.loggingIn = false;

    if ($rootScope.loggedIn){
      //already logged in move to home
      $location.path('/');
    }

    $scope.login = function () {
      $scope.loggingIn = true;
      Auth.setCredentials($scope.user.username, $scope.user.password);
      Login.query(function(success) {
        $rootScope.loggedIn = true;
        $rootScope.username = $scope.user.username;
        $location.path('/');
      }, function(error) {
        Auth.clearCredentials();
        $scope.errorMessage = "Ooops. Could not loggin? Try again maybe...";        
        $scope.loginError = true;
        $scope.loggingIn = false;
      });
    };
  })

  .controller('WelcomeCtrl', function ($scope) {
  }) 

  .controller('ConnectCtrl', function ($scope, $rootScope, $location, Accounts, Users) {
    $scope.loading = true;
    $rootScope.register = true;
    $scope.getAccounts = function () {    
      Accounts.get({}, function (response){
          if (response.data != undefined){
            $scope.accounts = response.data;            
          } else {
            $scope.accounts = [];
          }
          $scope.loading = false;
      });      
    };

    $scope.removeAccount = function (account) {
      console.log(account);
      Accounts.remove({id: account.id}, function(response) {
          //update the accounts
          $scope.getAccounts();
      });
    };  

    $scope.goHome = function(){
      $rootScope.register = false;
      $location.path("/");
    }

    $scope.getAccounts();    
    
  })     


  .controller('RegisterCtrl', function ($scope, $rootScope, $location, Auth, Login, Users, Dispatch) {
    $scope.loggingIn = false;
    $scope.hasUser = false;

    $scope.email = "";
    $scope.password = "";

    $scope.user = null;

    $scope.errorMessage = "";
    $rootScope.register = true;


    //edit that user with a new email and password
    $scope.register = function () {
        $scope.loggingIn = true;

        //get the username and password of a new user account
        Dispatch.getNewUser(function(success){
            Auth.setCredentials(success.email, success.password);
            Users.get({username: success.email}, function(response) {
              $scope.user = response.data;
              $scope.hasUser = true;
              Users.edit({id: $scope.user.id, username: $scope.user.username, email: $scope.email, passhash: $scope.password}, function(success) {
                      console.log(success);
                      $scope.login();
                  }, function (error){
                    $scope.errorMessage = "Email already used";
                    $scope.loggingIn = false;
                  });            
            });
        });
    };  

    //login in with new email and password

    $scope.login = function () {
      Auth.setCredentials($scope.email, $scope.password);
      Login.query(function(success) {
        $rootScope.username = $scope.email;
        $location.path('/welcome');
      }, function(error) {
        Auth.clearCredentials();
        $scope.errorMessage = "Ooops. Could not loggin? Try again maybe...";
        $scope.loggingIn = false;
      });
    };
  })  


.controller('LogoutCtrl', function ($scope, $rootScope, $location, Auth) {
    $rootScope.loggedIn = false;
    $rootScope.username = null;
    $rootScope.register = false;
    Auth.clearCredentials();
    $location.path('/login');
})

  
  .controller('MenuCtrl', function ($scope, Auth) {
      $scope.$watch(Auth.getCount, function(newVal, oldVal){
        console.log("changed authenticated to "+newVal);
        $scope.isAuthenticated = newVal;
      });
  });
    
