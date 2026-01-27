document.getElementById("getLocation").addEventListener("click", function () {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      document.getElementById("location").textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
    },
    function (error) {
      document.getElementById("location").textContent = `Geolocation error (${error.code}): ${error.message}`;
    }
  );
});
