import React, { useEffect, useState, useContext } from "react";
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
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import GridViewIcon from "@mui/icons-material/GridView";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { useEventCache } from "./EventCacheContext";
import EventTypesModal from "../Pages/EventTypesModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../contexts/AuthContext";

const EventTypeSelector = () => {
    const { eventTypes, setEventTypes, allEvents, setAllEvents } = useEventCache();
    const { authFetch } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [eventTypesModalOpen, setEventTypesModalOpen] = useState(false);
    const [editingEventType, setEditingEventType] = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [toDeleteType, setToDeleteType] = useState(null);

    const navigate = useNavigate();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const BACKENDURL = import.meta.env.VITE_BACKEND_URL;

    // Get user info for admin check
    const currentUser = JSON.parse(localStorage.getItem("userProfile")) || {};
    const userRole = currentUser?.role?.toLowerCase() || "";
    const isAdmin = userRole === "admin";

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

    const handleSaveEventType = async (eventTypeData) => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const oldName = editingEventType?.name;
            let url, method;

            if (editingEventType) {
                const encodedName = encodeURIComponent(oldName);
                url = `${BACKENDURL}/event-types/${encodedName}`;
                method = "PUT";
            } else {
                url = `${BACKENDURL}/event-types`;
                method = "POST";
            }

            const response = await authFetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(eventTypeData),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = {
                        detail: `HTTP ${response.status}: ${response.statusText}`,
                    };
                }
                throw new Error(
                    errorData.detail || `Failed to save event type: ${response.status}`
                );
            }

            const result = await response.json();
            setEventTypesModalOpen(false);
            setEditingEventType(null);
            await fetchEventTypesAndCache();
            toast.success(
                `Event type ${editingEventType ? "updated" : "created"} successfully!`
            );
            return result;
        } catch (error) {
            console.error("Error saving event type:", error);
            toast.error(`Failed to save event type: ${error.message}`);
            throw error;
        }
    };

    const handleDeleteType = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                toast.error("Please log in again");
                setTimeout(() => (window.location.href = "/login"), 2000);
                return;
            }

            const typeName =
                typeof toDeleteType === "string"
                    ? toDeleteType
                    : toDeleteType?.name || toDeleteType?.eventType || "";

            if (!typeName) {
                throw new Error("No event type name provided for deletion");
            }

            const encodedTypeName = encodeURIComponent(typeName);
            const url = `${BACKENDURL}/event-types/${encodedTypeName}`;

            try {
                const response = await authFetch(url, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();

                    if (response.status === 400 && errorData.detail && typeof errorData.detail === "object") {
                        const eventsCount = errorData.detail.events_count || 0;
                        const eventsList = errorData.detail.event_samples || [];

                        const eventsListText = eventsList
                            .slice(0, 5)
                            .map(
                                (e) =>
                                    `• ${e.name} (${e.date || "No date"}) - Status: ${e.status}`
                            )
                            .join("\n");

                        const shouldForceDelete = window.confirm(
                            `Cannot delete "${typeName}"\n\n` +
                            `${eventsCount} event(s) are using this event type:\n\n` +
                            `${eventsListText}\n` +
                            `${eventsCount > 5 ? `\n...and ${eventsCount - 5} more\n` : ""}\n` +
                            `━\n\n` +
                            `FORCE DELETE OPTION:\n\n` +
                            `Click OK to DELETE ALL ${eventsCount} events and the event type.\n` +
                            `Click Cancel to keep everything.\n\n` +
                            `THIS ACTION CANNOT BE UNDONE!`
                        );

                        if (shouldForceDelete) {
                            const forceUrl = `${url}?force=true`;
                            const forceResponse = await authFetch(forceUrl, {
                                method: "DELETE",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                },
                            });

                            const forceResult = await forceResponse.json();
                            await fetchEventTypesAndCache();
                            setConfirmDeleteOpen(false);
                            setToDeleteType(null);
                            toast.success(
                                `Deleted event type "${typeName}" and ${forceResult.events_deleted || eventsCount} events`,
                                { autoClose: 5000 }
                            );
                        } else {
                            toast.info("Deletion cancelled", { autoClose: 3000 });
                        }

                        setConfirmDeleteOpen(false);
                        setToDeleteType(null);
                        return;
                    }

                    throw new Error(errorData.detail || errorData.message || "Failed to delete event type");
                }

                const result = await response.json();
                await fetchEventTypesAndCache();
                setConfirmDeleteOpen(false);
                setToDeleteType(null);
                toast.success(
                    result.message || `Event type "${typeName}" deleted successfully!`
                );
            } catch (error) {
                console.error("Delete error:", error);

                if (error.message?.includes("401") || error.status === 401) {
                    toast.error("Session expired. Logging out...");
                    localStorage.removeItem("token");
                    localStorage.removeItem("userProfile");
                    setTimeout(() => (window.location.href = "/login"), 2000);
                    return;
                }

                let errorMessage = "Failed to delete event type";
                if (error.message) {
                    errorMessage = error.message;
                }

                setConfirmDeleteOpen(false);
                setToDeleteType(null);
                toast.error(errorMessage, { autoClose: 7000 });
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            toast.error(`Unexpected error: ${error.message}`, { autoClose: 7000 });
            setConfirmDeleteOpen(false);
            setToDeleteType(null);
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
            <Paper
                sx={{
                    p: 3,
                    borderRadius: "16px",
                    background: isDark 
                        ? "linear-gradient(180deg, rgba(25,25,25,0.95), rgba(15,15,15,0.95))"
                        : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,245,245,0.95))",
                    border: isDark 
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: isDark 
                        ? "0 20px 50px rgba(0,0,0,0.5)"
                        : "0 20px 50px rgba(0,0,0,0.08)",
                }}
            >
                {/* Header with Title and Toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h5" sx={{ color: isDark ? "#fff" : "#000" }}>Select Event Type</Typography>
                    
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => {
                            if (newMode !== null) {
                                setViewMode(newMode);
                            }
                        }}
                        sx={{
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                            borderRadius: "8px",
                            '& .MuiToggleButton-root': {
                                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                                '&.Mui-selected': {
                                    color: "#00c6ff",
                                    backgroundColor: "rgba(0,198,255,0.1)",
                                    '&:hover': {
                                        backgroundColor: "rgba(0,198,255,0.15)",
                                    }
                                }
                            }
                        }}
                    >
                        <ToggleButton value="grid" aria-label="grid view">
                            <GridViewIcon />
                        </ToggleButton>
                        <ToggleButton value="list" aria-label="list view">
                            <ViewAgendaIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

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
                        maxHeight: viewMode === 'grid' ? '600px' : 'none',
                        overflowY: viewMode === 'grid' ? 'auto' : 'visible',
                        display: 'grid',
                        gridTemplateColumns: viewMode === 'grid' 
                            ? { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }
                            : '1fr',
                        gap: viewMode === 'grid' ? 2 : 1.5,
                        pr: viewMode === 'grid' ? 1 : 0
                    }}
                >
                    {/* Event Type Cards */}
                    {filteredEventTypes.map((type) => {
                        const isCells = type.name && type.name.toUpperCase() === "CELLS";
                        
                        return (
                            <Card
                                key={type.name}
                                elevation={0}
                                sx={viewMode === 'grid' ? {
                                    position: "relative",
                                    borderRadius: "14px",
                                    overflow: "visible",
                                    cursor: "pointer",
                                    background: isDark 
                                        ? "linear-gradient(180deg, rgba(28,28,28,0.95), rgba(18,18,18,0.95))"
                                        : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,250,0.95))",
                                    border: isDark 
                                        ? "1px solid rgba(255,255,255,0.06)"
                                        : "1px solid rgba(0,0,0,0.08)",
                                    boxShadow: isDark 
                                        ? "0 10px 25px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)"
                                        : "0 10px 25px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
                                    transition: "all 0.25s ease",
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        height: "100%",
                                        width: "5px",
                                        background: "linear-gradient(180deg, #00c6ff, #00ff99)",
                                    },
                                    "&:hover": {
                                        transform: "translateY(-6px) scale(1.01)",
                                        boxShadow: isDark 
                                            ? "0 20px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,180,255,0.35)"
                                            : "0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,180,255,0.35)",
                                    },
                                } : {
                                    position: "relative",
                                    borderRadius: "12px",
                                    overflow: "visible",
                                    cursor: "pointer",
                                    background: isDark 
                                        ? "linear-gradient(180deg, rgba(28,28,28,0.95), rgba(18,18,18,0.95))"
                                        : "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,250,250,0.95))",
                                    border: isDark 
                                        ? "1px solid rgba(255,255,255,0.06)"
                                        : "1px solid rgba(0,0,0,0.08)",
                                    boxShadow: isDark 
                                        ? "0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)"
                                        : "0 8px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
                                    transition: "all 0.25s ease",
                                    display: "flex",
                                    alignItems: "stretch",
                                    "&::before": {
                                        content: '""',
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        height: "100%",
                                        width: "4px",
                                        background: "linear-gradient(180deg, #00c6ff, #00ff99)",
                                    },
                                    "&:hover": {
                                        transform: "translateX(4px)",
                                        boxShadow: isDark 
                                            ? "0 15px 35px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,180,255,0.35)"
                                            : "0 15px 35px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,180,255,0.35)",
                                    },
                                }}
                            >
                                <CardActionArea onClick={() => handleTypeClick(type.name)} sx={{ flex: 1 }}>
                                    <CardContent sx={viewMode === 'grid' 
                                        ? { py: 2.2, px: 2.5, pr: 7 } 
                                        : { py: 2, px: 2.5, pr: 7, display: 'flex', flexDirection: 'column', justifyContent: 'center' }
                                    }>
                                        <Typography
                                            variant={viewMode === 'grid' ? "subtitle1" : "h6"}
                                            sx={{
                                                fontWeight: 600,
                                                color: isDark ? "#fff" : "#000",
                                                letterSpacing: "0.2px",
                                                marginBottom: viewMode === 'grid' ? 0.5 : 0.25
                                            }}
                                            gutterBottom={false}
                                        >
                                            {type.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontSize: viewMode === 'grid' ? "0.82rem" : "0.85rem",
                                                lineHeight: viewMode === 'grid' ? 1.45 : 1.5,
                                                color: isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.6)",
                                                display: viewMode === 'grid' ? "-webkit-box" : "block",
                                                WebkitLineClamp: viewMode === 'grid' ? 2 : 1,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: viewMode === 'list' ? "ellipsis" : "unset",
                                            }}
                                        >
                                            {type.description || "No description available"}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>

                                
                            </Card>
                        );
                    })}

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

            {/* Event Types Modal */}
            {isAdmin && (
                <EventTypesModal
                    key={editingEventType?._id || "create"}
                    open={eventTypesModalOpen}
                    onClose={() => {
                        setEventTypesModalOpen(false);
                        setTimeout(() => setEditingEventType(null), 300);
                    }}
                    onSubmit={handleSaveEventType}
                    selectedEventType={editingEventType}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                sx={{
                    "& .MuiPaper-root": {
                        backgroundColor: isDark
                            ? theme.palette.background.paper
                            : "#fff",
                        color: isDark ? theme.palette.text.primary : "#000",
                    },
                }}
            >
                <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography id="delete-dialog-description">
                        Are you sure you want to delete the event type "{toDeleteType?.name || toDeleteType}"?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDeleteOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteType}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                pauseOnHover
                theme={isDark ? "dark" : "light"}
            />
        </Container>
    );
};

export default EventTypeSelector;