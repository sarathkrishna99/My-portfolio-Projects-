$(document).ready(function () {
  var skycons = new Skycons({
    'color': 'white'
  });
  
  var TIMEOVERWRITE = false;
  
  var STUB = {    
     city: {name: 'Earth'},
     list: [ 
       {temp: {max: 90},weather : [{description: 'clear'}]},
       {temp: {max: 90},weather : [{description: 'rain'}]},
       {temp: {max: 90},weather : [{description: 'storm'}]},
       {temp: {max: 90},weather : [{description: 'clear'}]},
       {temp: {max: 90},weather : [{description: 'snow'}]},
       {temp: {max: 90},weather : [{description: 'mist'}]},
       {temp: {max: 90},weather : [{description: 'sleet'}]},
       {temp: {max: 90},weather : [{description: 'rain'}]}  
     ]
  };
  
  var weatherService = {
    api: {
      url: 'http://api.openweathermap.org/data/2.5/forecast/daily?',
      mode: 'json',
      units: 'metric',
      cnt: 8,
      lat: 0,
      lon: 0
    },

    buildUrl: function (pos) {
      weatherService.api.lat = pos.coords.latitude;
      weatherService.api.lon = pos.coords.longitude;

      var apiParams = '';
      for (var key in weatherService.api) {
        if (key !== 'url') {
          apiParams += key + '=' + weatherService.api[key] + '&';
        }
      }
      return weatherService.api.url + apiParams.slice(0, -1); 
    },
    
    fetchStub: function() {
      var $d = $.Deferred();
      $d.resolve(STUB);
      return $d.promise();
    },

    fetchData: function (pos) {
      return $.ajax({
        url: weatherService.buildUrl(pos),
        type: 'GET',
        timeout: 3000,
        dataType: 'JSONP'
      });
    }
  };

  function bake(obj) {
    var tpl = '<div><strong>{{day}}</strong><canvas id="{{iconday}}" width="50" height="50"></canvas><span class="temp">{{temp}}°</span><div class="pop">{{desc}}</div></div>';

    for (var prop in obj) {
      tpl = tpl.replace('{{' + prop + '}}', obj[prop]);
    }

    return $(tpl);
  }

  function translateIcon(day, desc, main) {
    if (typeof main === 'undefined') {
      main = false;
    }
    
    day = 'icon_' + day;
    var time = getDayTime();
    
    if (desc.indexOf('clear') > -1) {
      
      if (time === 'night' && main === true) {
        skycons.add(day, Skycons.CLEAR_NIGHT);        
      } else {
        skycons.add(day, Skycons.CLEAR_DAY);
      }
      
    } else if (desc.indexOf('cloud') > -1) {      
      if (time === 'night' && main === true) {
        skycons.add(day, Skycons.PARTLY_CLOUDY_NIGHT);        
      } else {
        skycons.add(day, Skycons.PARTLY_CLOUDY_DAY);
      }      
    } else if (desc.indexOf('rain') > -1 || desc.indexOf('drizzle') > -1) {
      skycons.add(day, Skycons.RAIN);
    } else if (desc.indexOf('storm') > -1 || desc.indexOf('wind') > -1 || desc.indexOf('breeze') > -1) {
      skycons.add(day, Skycons.WIND);
    } else if (desc.indexOf('snow') > -1) {
      skycons.add(day, Skycons.SNOW);
    } else if (desc.indexOf('mist') > -1 || desc.indexOf('smoke') > -1 || desc.indexOf('fog') > -1) {
      skycons.add(day, Skycons.FOG);
    } else if (desc.indexOf('sleet') > -1) {
      skycons.add(day, Skycons.SLEET);
    } else {
      skycons.add(day, Skycons.CLOUDY);
    }
  }
  
  function getDayTime() {
    if (TIMEOVERWRITE) {
      return TIMEOVERWRITE;
    }
    
    var nao = new Date();
    var hour = nao.getHours();
    
    if (hour > 5 && hour < 10) {
      return 'morning';
    } else if (hour >= 10 && hour <= 17) {
      return 'day';
    } else {
      return 'night';
    }
  }
    
  function sortedDates() {
    var nao = new Date();
    var wkd = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    // im'a shuffelin!
    var mod = wkd.splice(0, nao.getDay());
    wkd = wkd.concat(mod);
    wkd = wkd.concat(wkd[0]);
    wkd[0] = 'MAIN';
    
    return wkd;
  }
  
  $('#select-time').on('change', function() {
    if ($(this).val() !== 'real') {
      TIMEOVERWRITE = $(this).val();
        $('body').removeClass().addClass(TIMEOVERWRITE);  
        $('h1').text(headlines[TIMEOVERWRITE]);
    } else {
      TIMEOVERWRITE = false;
        var dt = getDayTime();
        $('body').removeClass().addClass(dt);    
        $('h1').text(headlines[dt]);
    }
  });
  
  var dt = getDayTime();
  var headlines = {
    morning : 'Good Morning!',
    day : 'Good Afternoon!',
    night : 'Good Evenening!'
  }
  
  $('body').addClass(dt);    
  $('h1').text(headlines[dt]);
            
  function init(pos) {
    var promise = weatherService.fetchData(pos);        
    promise.done(function (json) {
      $('#app').addClass('show');
      var len = json.list.length;
      var weekdays = sortedDates();
      $('.city').text(json.city.name);
      $('#app').addClass('show');
      for (var i = 0; i < len; i++) {

        if (weekdays[i] !== 'MAIN') {
          $('#days').append(bake({
            day: weekdays[i], 
            iconday: 'icon_' + weekdays[i],
            temp: json.list[i].temp.max,
            desc: json.list[i].weather[0].description
          }));
          translateIcon(weekdays[i], json.list[i].weather[0].description);
        } else {
          $('#temp_MAIN').text(json.list[i].temp.max + '°');
          $('h2').text('Weather today looks like '+json.list[i].weather[0].description);
          translateIcon(weekdays[i], json.list[i].weather[0].description, true);
        }
      }
      skycons.play();
    });
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(init, function() {
      if (localStorage.getItem('weatherwidgetcache') !== null) {
          var json = JSON.parse(localStorage.getItem('weatherwidgetcache'));
          init({coords: {latitude: json.lat,longitude: json.lon}});
        
      } else {      
        
        $.ajax({
          url: 'http://ip-api.com/json',
          type: 'GET',
          timeout: 3000,
          dataType: 'JSONP',

          success: function(json) {     
            var d = new Date();
            $('#notify').animate({
              top: 0
            }, 500);

            setTimeout(function() {
              $('#notify').animate({
              top: '-70px'
            }, 500);

            }, 7000);

            // caching - due to usage limits
            localStorage.setItem('weatherwidgetcache', JSON.stringify({
              day: d.getDay(),
              lat: json.lat,
              lon: json.lon
            }));

            init({coords: {latitude: json.lat,longitude: json.lon}});
          }
        });    
      }
    });
  }
});