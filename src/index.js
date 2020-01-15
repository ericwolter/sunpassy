import 'normalize.css';
import './style.css';

import svgMoon from './moon.svg';
import svgSunLeft from './sun_left.svg';
import svgSunRight from './sun_right.svg';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

var google_api = document.createElement('script');
google_api.setAttribute('src','https://maps.googleapis.com/maps/api/js?key=AIzaSyAezL4IXXGbjmg6TK4Yxryr5BqUL4f21-I');
google_api.setAttribute('async', true);
google_api.setAttribute('defer', true);
document.head.appendChild(google_api);

var suncalc_api = document.createElement('script');
suncalc_api.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/suncalc/1.8.0/suncalc.min.js')
suncalc_api.setAttribute('async', true);
suncalc_api.setAttribute('defer', true);
suncalc_api.setAttribute('integrity', 'sha256-QQrHWG5ftBlXSj/H5cBsFVMV8L1f7CTdIbg8tpW0y4M=');
suncalc_api.setAttribute('crossorigin', 'anonymous');
document.head.appendChild(suncalc_api);

const π = Math.PI;
const EARTH_RADIUS = 6367.4447 // in km

function toRadians(degrees) {
  return degrees * (π / 180)
}

function sin(x) {
  return Math.sin(x);
}
function cos(x) {
  return Math.cos(x);
}
function atan2(y, x) {
  return Math.atan2(y, x);
}
function sqrt(x) {
  return Math.sqrt(x);
}

function distanceAndBearing(p1, p2) {
  const φ1 = toRadians(p1.lat())
  const φ2 = toRadians(p2.lat())
  const λ1 = toRadians(p1.lng())
  const λ2 = toRadians(p2.lng())

  const Δφ = φ2 - φ1
  const Δλ = λ2 - λ1

  let a = sin(Δφ/2) * sin(Δφ/2) + cos(φ1) * cos(φ2) * sin(Δλ/2) * sin(Δλ/2)
  let c = 2 * atan2(sqrt(a), sqrt(1-a))

  let y = sin(Δλ) * cos(φ2)
  let x = cos(φ1) * sin(φ2) - sin(φ1) * cos(φ2) * cos(Δλ)

  return { distance: EARTH_RADIUS * c, bearing: atan2(y,x) }
}

function averageDirections(points) {
  // calculate average unit vector
  let x = 0.0
  let y = 0.0
  
  for (const p of points) {
    x += cos(p.sun)
    y += sin(p.sun)
  }
  x /= points.length;
  y /= points.length;
  
  // convert average unit vector into angle
  return atan2(y,x)
}

function calculatePredominantSunDirection(step) {
  const departureTimestamp = step.transit.departure_time.value
  const arrivalTimestamp = step.transit.arrival_time.value
  const totalDuration = arrivalTimestamp - departureTimestamp

  const times = SunCalc.getTimes(departureTimestamp, step.path[0].lat(), step.path[0].lng())
  if (departureTimestamp < times.dawn) {
    return 'night';
  } else if (departureTimestamp > times.dusk) {
    return 'night';
  }

  let totalDistance = 0.0
  let annotatedPoints = []

  for (let i = 0; i < step.path.length - 1; i++) {
    const meta = distanceAndBearing(step.path[i], step.path[i+1])
    annotatedPoints.push({
      point: step.path[i],
      cumulativeDistance: totalDistance,
      bearing: meta.bearing,
      sun: 0
    });
    totalDistance += meta.distance;
  }
  annotatedPoints.push({
    point: step.path[step.path.length-1],
    cumulativeDistance: totalDistance,
    bearing: 0
  });

  for (let i = 0; i < annotatedPoints.length; i++) {
    const annotatedPoint = annotatedPoints[i];

    const tripPercentage = annotatedPoint.cumulativeDistance / totalDistance
    const tripTimestamp = new Date(departureTimestamp.getTime() + tripPercentage * totalDistance)

    const sunPosition = SunCalc.getPosition(tripTimestamp, annotatedPoint.point.lat(), annotatedPoint.point.lng())
    const sunDirection = atan2(sin(sunPosition.azimuth - annotatedPoint.bearing), cos(sunPosition.azimuth - annotatedPoint.bearing))
    var minDirection = sunDirection
    if(sunDirection > π/2) {
      minDirection = π - sunDirection
    }
    if(sunDirection < -π/2) {
      minDirection = -π - sunDirection
    }
    annotatedPoint.sun = minDirection
  }

  const averageDirection = averageDirections(annotatedPoints)
  if(averageDirection > 0) {
    return 'left'
  } else {
    return 'right'
  }
}

function* parseRoutesFromData(data) {
  for (const route of data.routes) {
    const routeNode = document.createElement('div');
    routeNode.classList.add('route');

    const firstLeg = route.legs[0]
    const lastLeg = route.legs[route.legs.length - 1];

    const routeHeaderNode = document.createElement('header');
    routeNode.appendChild(routeHeaderNode);

    const routeOriginTimeNode = document.createElement('time');
    routeOriginTimeNode.setAttribute("datetime", firstLeg.departure_time.value);
    routeOriginTimeNode.textContent = firstLeg.departure_time.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    routeHeaderNode.appendChild(routeOriginTimeNode);

    const routeDestinationTimeNode = document.createElement('time');
    routeDestinationTimeNode.setAttribute("datetime", lastLeg.arrival_time.value);
    routeDestinationTimeNode.textContent =  lastLeg.arrival_time.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    routeHeaderNode.appendChild(routeDestinationTimeNode);

    const routeOriginNode = document.createElement('div');
    routeOriginNode.textContent = firstLeg.start_address.toLocaleUpperCase();
    routeOriginNode.classList.add('route-station');
    routeHeaderNode.appendChild(routeOriginNode);

    const routeDestinationNode = document.createElement('div');
    routeDestinationNode.textContent = lastLeg.end_address.toLocaleUpperCase();
    routeDestinationNode.classList.add('route-station');
    routeHeaderNode.appendChild(routeDestinationNode);

    for (const leg of route.legs) {
      const legNode = document.createElement('div');
      legNode.classList.add('leg');

      for (const step of leg.steps) {
        if(step.travel_mode === 'WALKING') {
          continue;
        }
        const direction = calculatePredominantSunDirection(step);

        const stepNode = document.createElement('div');
        stepNode.classList.add('step');

        const stepDepartureTimeNode = document.createElement('time');
        stepDepartureTimeNode.setAttribute("datetime", step.transit.departure_time.value);
        stepDepartureTimeNode.textContent =  step.transit.departure_time.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        stepNode.appendChild(stepDepartureTimeNode);

        const stepDepartureNode = document.createElement('div');
        stepDepartureNode.textContent = step.transit.departure_stop.name;
        stepNode.appendChild(stepDepartureNode);

        const directionNode = document.createElement('div');
        switch (direction) {
          case 'left':
            directionNode.innerHTML = svgSunLeft;
            break;
          case 'right':
            directionNode.innerHTML = svgSunRight;
            break;
          case 'night':
            directionNode.innerHTML = svgMoon;
            break;
        }
        directionNode.classList.add('direction');
        directionNode.classList.add(direction);
        stepNode.appendChild(directionNode);

        const stepArrivalTimeNode = document.createElement('time');
        stepArrivalTimeNode.setAttribute("datetime", step.transit.arrival_time.value);
        stepArrivalTimeNode.textContent =  step.transit.arrival_time.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        stepNode.appendChild(stepArrivalTimeNode);

        const stepArrivalNode = document.createElement('div');
        stepArrivalNode.textContent = step.transit.arrival_stop.name;
        stepNode.appendChild(stepArrivalNode);

        legNode.appendChild(stepNode);
      }
      routeNode.appendChild(legNode);
    }
    yield routeNode;
  }
}

document.getElementById('search').addEventListener('click', function(ev) {
  ev.preventDefault();
  const directionsService = new google.maps.DirectionsService();
  const resultsNode = document.getElementById('results');

  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;
    var request = {
    origin: start,
    destination: end,
    travelMode: 'TRANSIT',
    provideRouteAlternatives: true,
    region: 'de-DE'
  };
  directionsService.route(request, function(result, status) {
    if(status !== 'OK') {
      console.error(status, result);
    }
    if (status == 'OK') {
      while (resultsNode.firstChild) {
        resultsNode.removeChild(resultsNode.firstChild);
      }
      for (const routeNode of parseRoutesFromData(result)) {
        resultsNode.appendChild(routeNode);
      }
    }
  });
});
