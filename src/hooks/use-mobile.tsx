
"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial value after the component has mounted on the client.
    checkDevice();

    // Add event listener for resize
    window.addEventListener("resize", checkDevice);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return { isMobile: hasMounted ? isMobile : false, hasMounted };
}
