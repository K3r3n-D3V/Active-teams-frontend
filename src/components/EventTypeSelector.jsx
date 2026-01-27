import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    Container,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Paper,
    Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEventCache } from "./EventCacheContext";

const EventTypeSelector = () => {
    const { eventTypes, setEventTypes, allEvents, setAllEvents } = useEventCache();
    const [selectedType, setSelectedType] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const BACKENDURL = import.meta.env.VITE_BACKEND_URL;

    const fetchEventTypesAndCache = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("access_token");

            const res = await fetch(
                `${BACKENDURL}/event-types`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (!res.ok) throw new Error("Failed to load event types");

            const data = await res.json();
            setEventTypes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const prefetchAllEvents = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token");
            const res = await fetch(`${BACKENDURL}/events`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setAllEvents(data);
        } catch (e) {
            console.error("Prefetch failed", e);
        }
    };

    useEffect(() => {
        if (!eventTypes) {
            fetchEventTypesAndCache();
        } else {
            setLoading(false);
        }

        if (!allEvents) {
            prefetchAllEvents();
        }
    }, []);


    const handleGo = () => {
        if (!selectedType) {
            navigate("/events/list");
        } else {
            navigate(`/events/list?type=${encodeURIComponent(selectedType)}`);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', mt: 10 }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 10 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Select Event Type
                </Typography>

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Event Type</InputLabel>
                    <Select
                        value={selectedType}
                        label="Event Type"
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>All Events</em>
                        </MenuItem>

                        {eventTypes.map((type) => (
                            <MenuItem key={type.name} value={type.name}>
                                {type.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    onClick={handleGo}
                >
                    Open Events
                </Button>
            </Paper>
        </Container>
    );
};

export default EventTypeSelector;
