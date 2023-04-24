async function isRequestValid() {
  var req = document.getElementById("ipOrDomainInput").value;
  document.getElementById("ipOrDomainInput").classList.remove("invalid");
  document.getElementById("no-result-message").style.opacity = 0;
  document.getElementById("ip").innerHTML = ""
  document.getElementById("org").innerHTML = ""
  document.getElementById("location").innerHTML = ""
  document.getElementById("timezone").innerHTML = ""
  var ipDataLocation = null
  if (isIPAddress(req)) {
    await getIpData(req)
      .then(ipData => ipDataLocation = ipData)
      .catch(error => console.error(error));
  } else if (isDomainName(req)) {
    var ipAddress = ""
    await getIpAddressFromDomainName(req)
    .then(ipAddressTemp => ipAddress = ipAddressTemp)
    .catch(error => console.error(error));

    await getIpData(ipAddress)
      .then(ipData => ipDataLocation = ipData)
      .catch(error => console.error(error));
  } else {
    document.getElementById("ipOrDomainInput").classList.add("invalid");
  }

  if (ipDataLocation !== null) {
    updateMap(ipDataLocation)
    updateDataInfos(ipDataLocation)
  }
}

function isIPAddress(req) {
  var expression = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  
  if (expression.test(req)) {
    var parties = req.split(".");
    
    for (var i = 0; i < parties.length; i++) {
      var partie = parseInt(parties[i]);
      
      if (partie < 0 || partie > 255) {
        return false;
      }
    }
    return true;
  }
  else {
    return false;
  }
}

function isDomainName(req) {
  var expression = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
  
  if (expression.test(req)) {
    var parties = req.split(".");
    
    for (var i = 0; i < parties.length; i++) {
      var partie = parties[i];
      
      if (partie.length > 63 || partie.length < 1) {
        return false;
      }
    }
    
    return true;
  }
  else {
    return false;
  }
}

function getIpAddressFromDomainName(domainName) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://dns.google/resolve?name=${domainName}`, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.Answer !== undefined) {
          const ipAddress = response.Answer[0].data;
          resolve(ipAddress);        
        } else {
          setDefaultMap()
          document.getElementById("no-result-message").style.opacity = 1;
        }
        
      } else {
        reject("Request failed");
      }
    };
    xhr.send();
  });
}

function getIpData(ipAddress) {
  return new Promise((resolve, reject) => {
    fetch('https://ipapi.co/' + ipAddress + '/json/')
      .then(function(response) {
        if (response.ok) {
          response.json().then(jsonData => {
            resolve(jsonData);
          });
        } else {
          reject("Request failed");
        }
      })
      .catch(function(error) {
        reject(error);
      });
  });
}

function updateDataInfos(ipDataLocation) {
  document.getElementById("ip").innerHTML = ipDataLocation.ip
  document.getElementById("org").innerHTML = ipDataLocation.org
  document.getElementById("location").innerHTML = ipDataLocation.city + ", " + ipDataLocation.country_name
  document.getElementById("timezone").innerHTML = ipDataLocation.timezone + " | " + ipDataLocation.utc_offset
}

function updateMap(ipDataLocation) {
  map.remove();
  map = L.map('map').setView([ipDataLocation.latitude, ipDataLocation.longitude], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var marker = L.marker([ipDataLocation.latitude, ipDataLocation.longitude]).addTo(map);
  marker.bindPopup("<b>" + ipDataLocation.city + "</b><br />" + ipDataLocation.region + ", " + ipDataLocation.country_name).openPopup();
}

function setDefaultMap() {
  if (map !== undefined) {
    map.remove();
  }
  
  map = L.map('map').setView([51.505, -0.09], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
}

var map;

async function main() {

	// Création d'un élément <script> pour charger la bibliothèque Leaflet
	var leafletScript = document.createElement('script');
	leafletScript.setAttribute('src', 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js');
	leafletScript.setAttribute('integrity', 'sha256-WBkoXOwTeyKclOHuWtc+i2uENFpDZ9YPdf5Hf+D7ewM=');
	leafletScript.setAttribute('crossorigin', '');
	document.head.appendChild(leafletScript);

	// Attente de la fin du chargement de la bibliothèque Leaflet
	leafletScript.onload = function() {
	    // Ici, vous pouvez utiliser les fonctionnalités de Leaflet
	    setDefaultMap()
	};

}

main();