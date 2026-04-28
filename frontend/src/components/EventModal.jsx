// use dialog as a modal
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, Box } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { formatDateMDY } from '../utils/date'

export default function EventModal({ open, handleClose, event }) {
    if (!event) return null

    const title = event.title || 'Untitled event'

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pr: 6 }}>
                {title}
                <IconButton
                    aria-label="close"
                    onClick={handleClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box mb={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Date:
                    </Typography>
                    <Typography variant="body1">
                        {formatDateMDY(event.date) || 'No date'}
                    </Typography>
                </Box>
                
                {event.location_address && (
                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Location:
                        </Typography>
                        <Typography variant="body1">
                            {event.location_address}
                        </Typography>
                    </Box>
                )}
                
                {event.description && (
                    <Box mb={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Description:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {event.description}
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {event.url && (
                    <Button href={event.url} target="_blank" rel="noopener noreferrer" variant="contained" color="primary">
                        More Info
                    </Button>
                )}
                <Button onClick={handleClose} color="inherit">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}
