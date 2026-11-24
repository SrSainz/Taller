import { useEffect, useState } from "react";

const storageKey = "sobre-ruedas:driver-calendar-marks:v1";
const changedEvent = "sobre-ruedas:driver-calendar-marks-changed";
const loadMarks = () => {
  try { return JSON.parse(window.localStorage.getItem(storageKey) || "{}") ?? {}; }
  catch { return {}; }
};

export default function useDriverCalendarMarks() {
  const [marks, setMarks] = useState(loadMarks);
  useEffect(() => {
    const refresh = () => setMarks(loadMarks());
    window.addEventListener("storage", refresh);
    window.addEventListener(changedEvent, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(changedEvent, refresh);
    };
  }, []);
  const isMarked = (driverId, date) => Boolean(marks[driverId]?.[date]);
  const toggleMark = (driverId, date) => {
    if (!driverId) return;
    const next = loadMarks();
    const driverMarks = { ...next[driverId] };
    if (driverMarks[date]) delete driverMarks[date];
    else driverMarks[date] = true;
    next[driverId] = driverMarks;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setMarks(next);
      window.dispatchEvent(new Event(changedEvent));
    } catch {
      window.alert("No se ha podido guardar la marca en este dispositivo.");
    }
  };
  return { isMarked, toggleMark };
}
