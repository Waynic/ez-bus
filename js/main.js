/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false */

( function( window ) {

'use strict';

// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else {
  // browser global
  window.classie = classie;
}

})( window );

'use strict';

// Extend JS String with repeat method
String.prototype.repeat = function(num) {
  return new Array(Math.round(num) + 1).join(this);
};

(function($) {

  // Add segments to a slider
  $.fn.addSliderSegments = function() {
    return this.each(function() {
      var $this = $(this),
        option = $this.slider('option'),
        amount = (option.max - option.min) / option.step,
        orientation = option.orientation;
      if ('vertical' === orientation) {
        var output = '',
          i;
        for (i = 1; i <= amount - 1; i + 1) {
          output += '<div class="ui-slider-segment" style="top:' + 100 / amount * i + '%;"></div>';
        }
        $this.prepend(output);
      } else {
        var segmentGap = 100 / (amount) + '%';
        var segment = '<div class="ui-slider-segment" style="margin-left: ' + segmentGap + ';"></div>';
        $this.prepend(segment.repeat(amount - 1));
      }
    });
  };

  jQuery(function($) {

    var $slider = $('#slider'),
      $walkSlider = $('#walk-slider'),
      sliderValueMultiplier = 15,
      sliderWalkValueMultiplier = 100;

    // Disable link clicks to prevent page scrolling
    $(document).on('click', 'a[href="#fakelink"]', function(e) {
      e.preventDefault();
    });

    // Custom Selects
    if ($('[data-toggle="select"]').length) {
      $('[data-toggle="select"]').select2({
        minimumResultsForSearch: -1
      });
    }

    // jQuery UI Sliders
    if ($slider.length > 0) {
      $slider.slider({
        min: 1,
        max: 4,
        value: 2,
        orientation: 'horizontal',
        range: 'min',
        slide: function(event, ui) {
          var _value = ui.value * sliderValueMultiplier;
          $slider.find('.ui-slider-value:last').text(_value + ' 分鐘').data('slidervalue', _value);
        }
      }).addSliderSegments($slider.slider('option').max);
    }

    $('.btn-group').on('click', 'a', function() {
      $(this).siblings().removeClass('active').end().addClass('active');
    });

    if ($walkSlider.length > 0) {
      $walkSlider.slider({
        min: 2,
        max: 9,
        value: 6,
        orientation: 'horizontal',
        range: 'min',
        slide: function(event, ui) {
          var _value = ui.value * sliderWalkValueMultiplier;
          $walkSlider.find('.ui-slider-value:last').text(_value + ' 公尺').data('slidervalue', _value);
        }
      }).addSliderSegments($walkSlider.slider('option').max);
    }

    // Checkboxes and Radio buttons
    $('[data-toggle="checkbox"]').radiocheck();
    $('[data-toggle="radio"]').radiocheck();

    // Switches
    if ($('[data-toggle="switch"]').length) {
      $('[data-toggle="switch"]').bootstrapSwitch();
    }

  });

})(jQuery);

'use strict';

(function($) {

  var $slider = $('#slider'),
    $walkSlider = $('#walk-slider');

  var $conveyance = $('#article-conveyance'),
    $wrapper = $('#wrapper');

  var state = {
    walkDistance: 600,
    tripTime: 30,
    startTime: '0800',
    weekType: 1,
    transitType: 'BYTM',
    result: {
      area: '0',
      level: 'A'
    }
  };

  $(function($) {

    classie.removeClass(document.getElementById('wrapper'), 'hidden');
    FastClick.attach(document.body);

    window.alert = swal;

    $('.iui-overlay').find('button').on('click', function() {

      pauseVideo();

      GMap.initialize(function() {

        $(window).resize(function(argument) {
          google.maps.event.trigger(GMap.map, 'resize');
        });

        google.maps.event.addListenerOnce(GMap.map, 'idle', function() {
          state.latitude = GMap.centerMarker.getPosition().lat();
          state.longitude = GMap.centerMarker.getPosition().lng();
        });

        google.maps.event.addListenerOnce(GMap.map, 'idle', function() {
          $('#overlay').slideUp('slow');
          classie.removeClass(document.getElementById('businfo-panal'), 'hidden');
          classie.removeClass(document.getElementById('menu-toggle'), 'hidden');
        });

        google.maps.event.addListener(GMap.centerMarker, 'dragend', function(event) {
          state.latitude = GMap.centerMarker.getPosition().lat();
          state.longitude = GMap.centerMarker.getPosition().lng();
          TripTaipeiService.query(state, setQueryResult);
        });

        var weekly = $('#weekly').find('.btn').on('click', function() {
          state.weekType = $(this).data('index');
          TripTaipeiService.query(state, setQueryResult);
        });
        state.weekType = new Date().getDay();
        $(weekly[state.weekType - 1]).addClass('active'); //設定星期別.

        $wrapper.find('#article-conveyance>[data-toggle="checkbox"]').on('change.radiocheck', function(ele) {
          state.transitType = '';
          if ($('#bus').prop('checked')) {
            state.transitType += 'B';
          }
          if ($('#mrt').prop('checked')) {
            state.transitType += 'M';
          }
          if ($('#train').prop('checked')) {
            state.transitType += 'T';
          }
          if ($('#youbike').prop('checked')) {
            state.transitType += 'Y';
          }
          TripTaipeiService.query(state, setQueryResult);
        });

        $walkSlider.on('slidestop', function(event, ui) {
          state.walkDistance = $walkSlider.find('.ui-slider-value:last').data('slidervalue');
          GMap.centerCircle.setOptions({
            radius: state.walkDistance
          });
          TripTaipeiService.query(state, setQueryResult);
        });

        $slider.on('slidestop', function(event, ui) {
          state.tripTime = $slider.find('.ui-slider-value:last').data('slidervalue');
          TripTaipeiService.query(state, setQueryResult);
        });

      });

    });

    $('[data-toggle="switch"]').on('switchChange.bootstrapSwitch', function(event, state) {
      var $switch = $(event.target);
      GMap.checkStop($switch.prop('value'), state);
      GMap.level[$switch.val()] = state;
    });

    // Closes the sidebar menu
    $('#menu-close').click(function(e) {
      e.preventDefault();
      $('#sidebar-wrapper').toggleClass('active');
    });

    // Opens the sidebar menu
    $('#menu-toggle').click(function(e) {
      e.preventDefault();
      $('#sidebar-wrapper').toggleClass('active');
    });

    $('#timepicker').timepicker({
      defaultTime: '08:00 AM',
      disableFocus: false,
      showMeridian: false
    }).on('hide.timepicker', function(e) {
      var _selectTime = e.time.value;
      if (e.time.hours < 10) {
        _selectTime = '0' + _selectTime;
      }
      state.startTime = _selectTime.replace(':', '');
      TripTaipeiService.query(state, setQueryResult);
    });

    // $('.iui-overlay').find('button').click(); //test code;
    // $('#menu-toggle').click(); //test code;

  });

  var setQueryResult = function(state) {
    $('#service-area').text(state.result.area);
    $('#service-level').text(state.result.level);
  };

  var pauseVideo = function() {
    var vid = document.getElementById('bgvid');
    vid.pause();
    vid.addEventListener('ended', function() {
      // only functional if "loop" is removed 
      vid.pause();
      // to capture IE10
      vid.classList.add('stopfade');
    });
  };

})(jQuery);

/*jshint browser: true, strict: true, undef: true */
/*global define: false */
(function() {

  'use strict';

  var stopsAry = [];

  var busLayer = new google.maps.Data();
  var mrtLayer = new google.maps.Data();
  var traLayer = new google.maps.Data();
  var ubikeLayer = new google.maps.Data();

  var GMap = {
    map: {},
    centerMarker: {},
    centerCircle: {},
    infowindow: {},
    level: {
      B: true,
      Y: true,
      T: true,
      M: true
    }
  };

  GMap.initialize = function(callback) {
    var latlng = new google.maps.LatLng(25.046281027241395, 121.51760685634758);
    var mapOptions = {
      zoom: 13,
      disableDefaultUI: true,
      scrollwheel: false,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.LEFT_CENTER
      },
      // center: new google.maps.LatLng() //全台23.714059, 120.832002
      styles: [{'featureType':'administrative','elementType':'all','stylers':[{'visibility':'on'},{'lightness':33}]},{'featureType':'administrative','elementType':'labels','stylers':[{'saturation':'-100'}]},{'featureType':'administrative','elementType':'labels.text','stylers':[{'gamma':'0.75'}]},{'featureType':'administrative.neighborhood','elementType':'labels.text.fill','stylers':[{'lightness':'-37'}]},{'featureType':'landscape','elementType':'geometry','stylers':[{'color':'#f9f9f9'}]},{'featureType':'landscape.man_made','elementType':'geometry','stylers':[{'saturation':'-100'},{'lightness':'40'},{'visibility':'off'}]},{'featureType':'landscape.natural','elementType':'labels.text.fill','stylers':[{'saturation':'-100'},{'lightness':'-37'}]},{'featureType':'landscape.natural','elementType':'labels.text.stroke','stylers':[{'saturation':'-100'},{'lightness':'100'},{'weight':'2'}]},{'featureType':'landscape.natural','elementType':'labels.icon','stylers':[{'saturation':'-100'}]},{'featureType':'poi','elementType':'geometry','stylers':[{'saturation':'-100'},{'lightness':'80'}]},{'featureType':'poi','elementType':'labels','stylers':[{'saturation':'-100'},{'lightness':'0'}]},{'featureType':'poi.attraction','elementType':'geometry','stylers':[{'lightness':'-4'},{'saturation':'-100'}]},{'featureType':'poi.park','elementType':'geometry','stylers':[{'color':'#c5dac6'},{'visibility':'on'},{'saturation':'-95'},{'lightness':'62'}]},{'featureType':'poi.park','elementType':'labels','stylers':[{'visibility':'on'},{'lightness':20}]},{'featureType':'road','elementType':'all','stylers':[{'lightness':20}]},{'featureType':'road','elementType':'labels','stylers':[{'saturation':'-100'},{'gamma':'1.00'}]},{'featureType':'road','elementType':'labels.text','stylers':[{'gamma':'0.50'}]},{'featureType':'road','elementType':'labels.icon','stylers':[{'saturation':'-100'},{'gamma':'0.50'}]},{'featureType':'road.highway','elementType':'geometry','stylers':[{'color':'#c5c6c6'},{'saturation':'-100'}]},{'featureType':'road.highway','elementType':'geometry.stroke','stylers':[{'lightness':'-13'}]},{'featureType':'road.highway','elementType':'labels.icon','stylers':[{'lightness':'0'},{'gamma':'1.09'}]},{'featureType':'road.arterial','elementType':'geometry','stylers':[{'color':'#e4d7c6'},{'saturation':'-100'},{'lightness':'47'}]},{'featureType':'road.arterial','elementType':'geometry.stroke','stylers':[{'lightness':'-12'}]},{'featureType':'road.arterial','elementType':'labels.icon','stylers':[{'saturation':'-100'}]},{'featureType':'road.local','elementType':'geometry','stylers':[{'color':'#fbfaf7'},{'lightness':'77'}]},{'featureType':'road.local','elementType':'geometry.fill','stylers':[{'lightness':'-5'},{'saturation':'-100'}]},{'featureType':'road.local','elementType':'geometry.stroke','stylers':[{'saturation':'-100'},{'lightness':'-15'}]},{'featureType':'transit.station.airport','elementType':'geometry','stylers':[{'lightness':'47'},{'saturation':'-100'}]},{'featureType':'water','elementType':'all','stylers':[{'visibility':'on'},{'color':'#acbcc9'}]},{'featureType':'water','elementType':'geometry','stylers':[{'saturation':'53'}]},{'featureType':'water','elementType':'labels.text.fill','stylers':[{'lightness':'-42'},{'saturation':'17'}]},{'featureType':'water','elementType':'labels.text.stroke','stylers':[{'lightness':'61'}]}]
    };
    // 台北車站:25.0459331,121.5191915
    // 101:25.0339186,121.5624493

    this.map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

    // getCurrentLocation(); //定位.

    this.centerMarker = new google.maps.Marker({
      draggable: true,
      position: latlng,
      map: this.map,
      icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSIyNCIgdmVyc2lvbj0iMS4xIiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTEwMjguNCkiPjxwYXRoIGQ9Im0xMi4wMzEgMTAzMC40Yy0zLjg2NTcgMC02Ljk5OTggMy4xLTYuOTk5OCA3IDAgMS4zIDAuNDAxNyAyLjYgMS4wOTM4IDMuNyAwLjAzMzQgMC4xIDAuMDU5IDAuMSAwLjA5MzggMC4ybDQuMzQzMiA4YzAuMjA0IDAuNiAwLjc4MiAxLjEgMS40MzggMS4xczEuMjAyLTAuNSAxLjQwNi0xLjFsNC44NDQtOC43YzAuNDk5LTEgMC43ODEtMi4xIDAuNzgxLTMuMiAwLTMuOS0zLjEzNC03LTctN3ptLTAuMDMxIDMuOWMxLjkzMyAwIDMuNSAxLjYgMy41IDMuNSAwIDItMS41NjcgMy41LTMuNSAzLjVzLTMuNS0xLjUtMy41LTMuNWMwLTEuOSAxLjU2Ny0zLjUgMy41LTMuNXoiIGZpbGw9IiNjMDM5MmIiLz48cGF0aCBkPSJtMTIuMDMxIDEuMDMxMmMtMy44NjU3IDAtNi45OTk4IDMuMTM0LTYuOTk5OCA3IDAgMS4zODMgMC40MDE3IDIuNjY0OCAxLjA5MzggMy43NDk4IDAuMDMzNCAwLjA1MyAwLjA1OSAwLjEwNSAwLjA5MzggMC4xNTdsNC4zNDMyIDguMDYyYzAuMjA0IDAuNTg2IDAuNzgyIDEuMDMxIDEuNDM4IDEuMDMxczEuMjAyLTAuNDQ1IDEuNDA2LTEuMDMxbDQuODQ0LTguNzVjMC40OTktMC45NjMgMC43ODEtMi4wNiAwLjc4MS0zLjIxODggMC0zLjg2Ni0zLjEzNC03LTctN3ptLTAuMDMxIDMuOTY4OGMxLjkzMyAwIDMuNSAxLjU2NyAzLjUgMy41cy0xLjU2NyAzLjUtMy41IDMuNS0zLjUtMS41NjctMy41LTMuNSAxLjU2Ny0zLjUgMy41LTMuNXoiIGZpbGw9IiNlNzRjM2MiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgMTAyOC40KSIvPjwvZz48L3N2Zz4='
    });

    this.infowindow = new google.maps.InfoWindow({
      content: '<p>拖曳我<span class="glyphicon glyphicon-hand-up" aria-hidden="true"></span></p>'
    });
    this.infowindow.open(this.map, this.centerMarker);

    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, this.map);

    centerControlDiv.index = 1;
    this.map.controls[google.maps.ControlPosition.LEFT_CENTER].push(centerControlDiv);

    this.centerCircle = new google.maps.Circle({
      strokeColor: '#2980B9',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3498DB',
      fillOpacity: 0.1,
      map: this.map,
      center: latlng,
      radius: 600,
      zIndex: 999
    });

    // google.maps.event.addListener(this.centerMarker, 'dragend', function(event) {
    //   locationAddress(this.centerMarker.getPosition().lat(), this.centerMarker.getPosition().lng());
    // });

    // google.maps.event.addListener(this.map, 'idle', function() {
    //   this.centerMarker.setPosition(this.map.getCenter());
    //   this.centerCircle.setCenter(this.centerMarker.getPosition());
    // });

    google.maps.event.addListener(this.centerMarker, 'dragstart', function(event) {
      this.infowindow.close();
    }.bind(this));

    google.maps.event.addListener(this.centerMarker, 'drag', function(event) {
      this.centerCircle.setCenter(this.centerMarker.getPosition());
    }.bind(this));

    (callback && typeof(callback) === 'function') && callback();
  };

  /**
   * 定位現在位置.
   * @param  {[type]} latitude  [description]
   * @param  {[type]} longitude [description]
   * @return {[type]}           [description]
   */
  var locationAddress = function(latitude, longitude) {
    GMap.map.setCenter(new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude)));
    // console.log('定位完成！');
  };

  /**
   * 定位成功.
   * @param  {[type]} pos [description]
   * @return {[type]}     [description]
   */
  var successCallback = function(pos) {
    locationAddress(pos.coords.latitude, pos.coords.longitude);
  };

  /**
   * 定位失敗.
   * @param  {[type]} error [description]
   * @return {[type]}       [description]
   */
  var errorCallback = function(error) {
    switch (error.code) {
      case 1:
        console.error('錯誤!應用程式沒有權限使用定位服務!');
        break;
      case 2:
        console.error('錯誤!取得位址資料時發生錯誤!');
        break;
      case 3:
        console.error('錯誤!超過等待時間...');
        break;
      default:
        console.error('不明錯誤...');
        break;
    }
  };

  /**
   * 客製化按鈕.
   * @param {[type]} controlDiv [description]
   * @param {[type]} map        [description]
   */
  function CenterControl(controlDiv, map) {

    // Set CSS for the control border.
    this.controlUI = document.createElement('div');
    this.controlUI.style.backgroundColor = '#fff';
    this.controlUI.style.border = '2px solid #fff';
    this.controlUI.style.borderRadius = '3px';
    this.controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    this.controlUI.style.cursor = 'pointer';
    this.controlUI.style.marginLeft = '10px';
    this.controlUI.style.textAlign = 'center';
    this.controlUI.title = '顯示您的位置';

    // Set CSS for the control interior.
    this.controlText = document.createElement('div');
    this.controlText.style.color = 'rgb(25,25,25)';
    this.controlText.style.fontSize = '14px';
    this.controlText.style.lineHeight = '22px';
    this.controlText.style.paddingLeft = '5px';
    this.controlText.style.paddingRight = '5px';
    this.controlText.innerHTML = '<span class="glyphicon glyphicon-screenshot" aria-hidden="true"></span>';
    this.controlUI.appendChild(this.controlText);

    controlDiv.appendChild(this.controlUI);

    // Setup the click event listeners.
    this.controlUI.addEventListener('click', function() {
      getCurrentLocation();
    });

  }

  /**
   * 取得現在位置.
   * @return {[type]} [description]
   */
  var getCurrentLocation = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    } else {
      console.error('錯誤!不支援定位服務!');
    }
  };

  var setMarkerInfoWindow = function(marker, stopName) {
    marker.addListener('click', function() {
      this.infowindow.setOptions({
        content: '<p>' + stopName + '</p>'
      });
      this.infowindow.open(this.map, marker);
    }.bind(GMap));
  };

  GMap.clearMap = function(type) {
    switch (type) {
      case 'Stop':
        if (stopsAry) {
          for (var i = stopsAry.length - 1; i >= 0; i--) {
            stopsAry[i].setMap(null);
          }
          stopsAry.length = 0;
        }
        break;
      case 'GeoJson':
        busLayer.forEach(function(feature) {
          busLayer.remove(feature);
        });

        traLayer.forEach(function(feature) {
          traLayer.remove(feature);
        });

        mrtLayer.forEach(function(feature) {
          mrtLayer.remove(feature);
        });

        ubikeLayer.forEach(function(feature) {
          ubikeLayer.remove(feature);
        });

        break;
    }
  };

  GMap.checkStop = function(type, state) {
    if (stopsAry) {
      for (var i = stopsAry.length - 1; i >= 0; i--) {
        if (stopsAry[i].type === type) {
          stopsAry[i].setMap(state ? this.map : null);
        }
      }
    }
  }.bind(GMap);

  GMap.addStops = function(data) {
    this.clearMap('Stop');
    if (data.result.length > 0) {
      for (var i = data.result.length - 1; i >= 0; i--) {
        var _fillColor = '';
        var _title = '';
        var _type = data.result[i].type;
        switch (_type) {
          case 'M':
            _fillColor = '#2980b9';
            _title = '捷運站: ';
            break;
          case 'B':
            _fillColor = '#16a085';
            _title = '客運站: ';
            break;
          case 'T':
            _fillColor = '#c0392b';
            _title = '火車站: ';
            break;
          case 'Y':
            _fillColor = '#f39c12';
            _title = 'YouBike: ';
            break;
        }

        var _marker = new google.maps.Marker({
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: _fillColor,
            fillOpacity: 1,
            scale: 4.5,
            strokeColor: 'white',
            strokeWeight: 0.5
          },
          map: this.level[_type] ? this.map : null,
          type: _type,
          position: {
            lat: parseFloat(data.result[i].lat),
            lng: parseFloat(data.result[i].lng),
          }
        });

        stopsAry.push(_marker);
        setMarkerInfoWindow(_marker, _title + data.result[i].name);
      }
    }
  }.bind(GMap);

  GMap.addGeoJson = function(data) {
    this.clearMap('GeoJson');
    if (!jQuery.isEmptyObject(data)) {
      mrtLayer.setStyle({
        fillColor: '#2980b9',
        fillOpacity: 0.5,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.8,
        strokeWeight: 0.5,
        zIndex: 991
      });

      busLayer.setStyle({
        fillColor: '#16a085',
        fillOpacity: 0.5,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.8,
        strokeWeight: 0.5,
        zIndex: 995
      });

      traLayer.setStyle({
        fillColor: '#c0392b',
        fillOpacity: 0.5,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.8,
        strokeWeight: 0.5,
        zIndex: 997
      });

      ubikeLayer.setStyle({
        fillColor: '#f39c12',
        fillOpacity: 0.6,
        strokeColor: '#FFFFFF',
        strokeOpacity: 0.8,
        strokeWeight: 1.2,
        zIndex: 996
      });

      if (data.result.B) {
        busLayer.addGeoJson(jQuery.parseJSON(data.result.B));
      }
      if (data.result.M) {
        mrtLayer.addGeoJson(jQuery.parseJSON(data.result.M));
      }
      if (data.result.T) {
        traLayer.addGeoJson(jQuery.parseJSON(data.result.T));
      }
      if (data.result.Y) {
        ubikeLayer.addGeoJson(jQuery.parseJSON(data.result.Y));
      }

      busLayer.setMap(this.map);
      mrtLayer.setMap(this.map);
      traLayer.setMap(this.map);
      ubikeLayer.setMap(this.map);
    }
  }.bind(GMap);

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(GMap);
  } else {
    // browser global
    window.GMap = GMap;
  }

})();

/*jshint browser: true, strict: true, undef: true */
/*global define: false */
(function(window, $) {

  'use strict';

  var Urls = {
    domain: 'http://demo.datarget.com.tw/TripTaipei'
  };

  Urls.getStops = Urls.domain + '/stops/getStops/#{lng}/#{lat}/#{distance}/#{type}';
  Urls.getTripArea = Urls.domain + '/getTripArea/GeoJson';

  var TripTaipeiService = {};

  TripTaipeiService.getStops = function(state, callback) {
    return $.ajax({
      // url:'../data/stops.json',
      // dataType: 'json',
      url: Urls.getStops.replace('#{lng}', state.longitude).replace('#{lat}', state.latitude).replace('#{distance}', state.walkDistance).replace('#{type}', state.transitType),
      jsonp: 'callback',
      dataType: 'jsonp',
      success: function(response) {
        if (response.result === '0') {
          swal({
            title: 'Oops!',
            text: '設定條件內無大眾運輸資料.',
          });
        }
        (callback && typeof(callback) === "function") && callback(response);
      },
      error: function(error) {
        console.error(error);
      }
    });
  };

  TripTaipeiService.getTripArea = function(state, callback) {
    return $.ajax({
      // url:'../data/tripArea.json',
      // dataType: 'json',
      url: Urls.getTripArea,
      jsonp: 'callback',
      dataType: 'jsonp',
      data: {
        lat: state.latitude,
        lng: state.longitude,
        walkDistance: state.walkDistance,
        tripTime: state.tripTime,
        weekType: state.weekType,
        startTime: state.startTime,
        transitType: state.transitType
      },
      beforeSend: function(xhr) {
        classie.removeClass(document.getElementById('pageBlock'), 'hidden');
      },
      complete: function() {
        classie.addClass(document.getElementById('pageBlock'), 'hidden');
      },
      success: function(response) {
        console.log(response.result.BUSAREA)
        if (jQuery.isEmptyObject(response)) {
          swal({
            title: "Sorry!",
            text: "設定條件內 無大眾運輸資料",
          });
        }
        state.result.area = response.result.BUSAREA;
        state.result.level = response.result.BUSSERVICE;
        (callback && typeof(callback) === "function") && callback(response);
      },
      error: function(error) {
        console.error(error);
      }
    });
  };

  TripTaipeiService.query = function(state, callback) {
    console.log(state)
    var stopsAjax = this.getStops(state, GMap.addStops);
    var tripAreaAjax = this.getTripArea(state, GMap.addGeoJson);
    $.when.apply($, [stopsAjax, tripAreaAjax]).then(function() {
      (callback && typeof(callback) === "function") && callback(state);
    });
  };

  // transport
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(TripTaipeiService);
  } else {
    // browser global
    window.TripTaipeiService = TripTaipeiService;
  }

})(window, jQuery);
