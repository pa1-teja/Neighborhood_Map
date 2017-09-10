/*
To change this license header, choose License Headers in Project Properties.
To change this template file, choose Tools | Templates
and open the template in the editor.
*/
/* 
    Created on : Aug 31, 2017, 3:30:38 PM
    Author     : Pavan
*/
//$(document).ajaxError(function myErrorHandler(event, xhr, ajaxOptions, thrownError) {
//   
//    alert("There was an error accessing url! Please check console for more options. ");
//});

var placeInputFilter;
var openOrcloseNavWindow = false;
var markers = [];
var map;
var geocoder;
var infoWindow;


var placesNames = [];
var placeResults = [];


var currentMarker = null;


var clientID = 'H2OQCWRST3WU3BZUIPYPAFAN4XPUZ423Z3ZJXVHK4VP5UA3Q';
var clientSecret = '0PHM0YNI4PKTID0UNUMSBDXQGQFCXMVQVAOD4EJVYKYGRZJ4';
var infoWindowData;


var NavBarViewModel = function() {
    var self = this;
    self.places = ko.observableArray();
    self.inputPlaceFilter = ko.observable("");

    self.test = function() {
        console.log("input text : " + self.inputPlaceFilter());
    };

    self.filterPlaces = ko.computed(function() {

        return ko.utils.arrayFilter(self.places(), function(item) {

            item.setMap(map);
            if (self.inputPlaceFilter() === undefined || self.inputPlaceFilter() === "")
                return true;
            else if (item.title.toLowerCase().indexOf(self.inputPlaceFilter().toLowerCase()) === -1) {
                item.setMap(null);
                return false;
            } else
                return true;
        });
    });

    self.showOnClick = function() {

        var largeInfowindow = new google.maps.InfoWindow();
        populateInfoWindow(this, largeInfowindow);
    };


};


var navBarModel = new NavBarViewModel();
ko.applyBindings(navBarModel);

function openOrCloseNav() {

    if (openOrcloseNavWindow) {
        /* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
          $(".side_nav_places_list").width(0);
        $(".main_body").css("margin-left", 0);
        $(document.body).css("background-color", "white");

        openOrcloseNavWindow = false;
    } else {
        /* Set the width of the side navigation to 350px and the left margin of the page content to 300px and add a black background color to body */
          $(".side_nav_places_list").width(350);
        $(".main_body").css("margin-left", 350);
        $(document.body).css("background-color", "rgba(0,0,0,0.4)");
        
        openOrcloseNavWindow = true;
    }
}

//Google Maps PlacesAPI

function callback(results, status) {
    placeResults = [];
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            placeResults.push(results[i]);
        }
        createMarker();
    }
}



function createMarker() {

    var infowindow = new google.maps.InfoWindow();
    placeResults.forEach(function(item, index) {
        var placeLoc = placeResults[index].geometry.location;
        var placeName = placeResults[index].name;
        placesNames.push(placeName);
        var marker = new google.maps.Marker({
            map: map,
            position: placeLoc,
            label: index.toString(),
            title: placeName,
            animation: google.maps.Animation.DROP
        });

        marker.addListener('click', function() {
            populateInfoWindow(this, infowindow);
            map.setZoom(8);
            map.setCenter(marker.getPosition());
        });

        markers.push(marker);

    });

    navBarModel.places(markers);
}



// This function is used to get info from third party api 
// and populate infoWindow for map
function getInfoWindowData(latlng, query) {
    var deferred = $.Deferred();


    var url = 'https://api.foursquare.com/v2/venues/search?ll=' + latlng.lat() + ',' + latlng.lng() +
        '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118&query=' + query;

    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: url,
        success: function(data) {
            var response = {
                url: '',
                street: '',
                city: '',
                phone: '',
                name: ''
            };
       var results = {};
            if (data.response.venues.length > 0) {
                results = data.response.venues[0];
                response.url = results.url;
                console.log("infowindow url: " + response.url);
                if (response.url === undefined) {
                    response.url = "URL unknown";
                    console.log("infowindow url: " + response.url);
                }
                response.street = results.location.formattedAddress[0];
                console.log("infowindow street: " + response.street);
                if (response.street === undefined) {
                    response.street = "Street Unknown";
                }
                response.city = results.location.formattedAddress[1];
                if (response.city === undefined) {
                    response.city = "City Unknown";
                }
                console.log("infowindow city: " + response.city);
                response.phone = results.contact.phone;
                if (response.phone === undefined) {
                    response.phone = "Phone Number Unknown";
                }
                console.log("infowindow phone: " + response.phone);
                response.name = results.name;
                console.log("infowindow name: " + response.name);
                if (typeof response.name === 'undefined') {
                    response.name = "Name unknown";
                } else {
                    response.phone = response.phone;
                }

                deferred.resolve({
                    status: true,
                    response: response
                });
            } else {
                deferred.resolve({
                    status: false,
                    response: {}
                });
            }
        },
        error: function(response) {
            deferred.resolve({
                status: false,
                response: {}
            });
            alert("failed to get the response : " + response);
        }
    });
    return deferred.promise();

}


// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open on the marker which is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {

    if (currentMarker !== null) {
        if (currentMarker.infoWindow)
            currentMarker.infoWindow.close(map, null);
    }



    if (infowindow.marker !== marker) {

        infowindow.setContent('<div id="pano"></div>');
        getInfoWindowData(marker.position, marker.title).then(function(data) {
            if (data.status) {
                if(data.response.name !== undefined){
                    infoWindowData = '<div><div class="title"><b>' + data.response.name + "</b></div>";
                }else{
                    infoWindowData = '<div><div class="title"><b>' + "Unknown Name" + "</b></div>";
                }
                if(data.response.url !== undefined){
                    infoWindowData += '<div class="content"><a href="' + data.response.url + '">Click Here!</a></div>';
                } else{
                    infoWindowData += '<div class="content">Unknown Link</div>';
                }
                
                if(data.response.street !== undefined){
                    infoWindowData += '<div class="content">' + data.response.street + "</div>";
                }else{
                    infoWindowData += '<div class="content">' + "Unknown Street" + "</div>";
                }
                if(data.response.city !== undefined){
                    infoWindowData += '<div class="content">' + data.response.city + "</div>";
                } else{
                    infoWindowData += '<div class="content">' + "Unknown City" + "</div>";
                }
                if(data.response.phone !== undefined){
                  infoWindowData +=   '<div class="content">' + data.response.phone + '</div></div><div id="pano"></div>';  
                } else{
                    infoWindowData +=   '<div class="content">' + "Phone Number Unknown" + '</div></div><div id="pano"></div>'
                }
                
                infowindow.setContent(infoWindowData);
            
          

            } else {
                console.error('Unable to load data from foursqure. Setting default infoWindow');
                infowindow.setContent('<div class="title">' + marker.title + '</div><div id="pano"></div>');
            }

            // bouncing animation to marker on click of the marker.
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 2000);
            }

            infowindow.marker = marker;
            // Make sure the marker properties are cleared when the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
                currentMarker = null;
            });
            var streetViewService = new google.maps.StreetViewService();
            var radius = 500;

            function getStreetView(data, status) {
                if (status === google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;

                    var heading = google.maps.geometry.spherical.computeHeading(
                        nearStreetViewLocation, marker.position);
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                        document.getElementById('pano'), panoramaOptions);
                } else {
                    console.error('Unable to load SteerView : ' + status);
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                        '<div>No Street View Found</div>');
                }
            }


            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
            infowindow.open(map, marker);


            currentMarker = marker;
            currentMarker.infoWindow = infowindow;
        });

    }
}

function fitToBound(value) {
    if (value.length === 0)
        return;
    var bounds = new google.maps.LatLngBounds();

    for (var i = 0; i < value.length; i++) {
        value[i].setMap(map);
        bounds.extend(value[i].position);
    }
    map.fitBounds(bounds);
}


//Google Maps Location API
function initMap() {

    infoWindow = new google.maps.InfoWindow();
    var address = "Hyderabad";
    geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': address
    }, function(results, status) {
        if (status === 'OK') {
            map = new google.maps.Map(document.getElementById('map_body'), {
                zoom: 10,
                center: results[0].geometry.location
            });
            placeResults.push(results[0]);

            var hydCoordinates = new google.maps.LatLng(results[0].geometry.location.lat(),
                results[0].geometry.location.lng());

            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: hydCoordinates,
                radius: 50000,
                type: ['shopping_mall']
            }, callback);

        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });

    $(window).resize(function() {
        fitToBound(navBarModel.filterPlaces());
    });
}

 function mapErrorHandler() {
        alert("failed to load the Google Map");
    }