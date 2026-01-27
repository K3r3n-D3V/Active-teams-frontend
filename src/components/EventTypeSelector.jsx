import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    CircularProgress,
    Container,
    Paper,
    Card,
    CardContent,
    CardActionArea,
    TextField,
    InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useEventCache } from "./EventCacheContext";

const EventTypeSelector = () => {
    const { eventTypes, setEventTypes, allEvents, setAllEvents } = useEventCache();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

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

    const handleTypeClick = (typeName) => {
        if (!typeName) {
            navigate("/events/list");
        } else {
            navigate(`/events/list?type=${encodeURIComponent(typeName)}`);
        }
    };

    // Filter event types based on search query (search both name and description)
    const filteredEventTypes = eventTypes?.filter((type) =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

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
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                    Select Event Type
                </Typography>

                {/* Search Field */}
                <TextField
                    fullWidth
                    placeholder="Search event types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 3 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />

                <Box
                    sx={{
                        maxHeight: '500px',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)'
                        },
                        gap: 2,
                        pr: 1
                    }}
                >
                    {/* All Events Card - Show only if search is empty or matches "all" */}
                    {(!searchQuery || "all events".includes(searchQuery.toLowerCase())) && (
                        <Card 
                            elevation={2}
                            sx={{ 
                                '&:hover': { 
                                    elevation: 4,
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.2s'
                                }
                            }}
                        >
                            <CardActionArea onClick={() => handleTypeClick("")}>
                                <CardContent sx={{ py: 2, px: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                        All Events
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        View all events across all types
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    )}

                    {/* Event Type Cards */}
                    {filteredEventTypes.map((type) => (
                        <Card 
                            key={type.name}
                            elevation={2}
                            sx={{ 
                                '&:hover': { 
                                    elevation: 4,
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.2s'
                                }
                            }}
                        >
                            <CardActionArea onClick={() => handleTypeClick(type.name)}>
                                <CardContent sx={{ py: 2, px: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                        {type.name}
                                    </Typography>
                                    {type.description && (
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary" 
                                            sx={{ 
                                                fontSize: '0.875rem',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            {type.description}
                                        </Typography>
                                    )}
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}

                    {/* No Results Message */}
                    {filteredEventTypes.length === 0 && searchQuery && (
                        <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>
                            <Typography color="text.secondary">
                                No event types found matching "{searchQuery}"
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default EventTypeSelector;