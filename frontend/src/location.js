export function getLocation() {
  const button = document.getElementById("getLocation");
  const output = document.getElementById("location");

  if (!button || !output) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const handleClick = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          output.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
          resolve([longitude, latitude]);
        },
        (error) => {
          output.textContent = `Geolocation error (${error.code}): ${error.message}`;
          resolve(null);
        }
      );
    };

    button.addEventListener("click", handleClick, { once: true });
  });
}
