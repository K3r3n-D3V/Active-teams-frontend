import { createContext, useContext, useState } from "react";

const EventCacheContext = createContext(null);

export const useEventCache = () => useContext(EventCacheContext);

export const EventCacheProvider = ({ children }) => {
  const [eventTypes, setEventTypes] = useState(null);   // with counts
  const [allEvents, setAllEvents] = useState(null);     // full list

  return (
    <EventCacheContext.Provider
      value={{
        eventTypes,
        setEventTypes,
        allEvents,
        setAllEvents,
      }}
    >
      {children}
    </EventCacheContext.Provider>
  );
};
