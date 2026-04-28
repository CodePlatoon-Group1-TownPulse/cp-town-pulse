import { AppBar, Toolbar, Typography, Button, Box, Stack, IconButton } from '@mui/material'
import { Brightness4, Brightness7 } from '@mui/icons-material'

export default function NavBar({ isLoggedIn, page, onSignUp, onSignIn, onHome, onSaved, onSignOut, mode, toggleColorMode }) {
    return (
        <AppBar position="static" sx={{ mb: 3 }} color="primary">
            <Toolbar>
                <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ flexGrow: 1 }}
                    onClick={isLoggedIn ? onHome : onSignIn}
                    style={{ cursor: 'pointer' }}
                >
                    Town Pulse
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isLoggedIn ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Button
                                color="inherit"
                                onClick={onHome}
                            >
                                Home
                            </Button>
                            <Button
                                color="inherit"
                                onClick={onSaved}
                            >
                                Saved
                            </Button>

                            <Button
                                color="inherit"
                                variant="outlined"
                                onClick={onSignOut}
                                sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
                            >
                                Sign Out
                            </Button>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={1}>
                            {page !== 'signin' && (
                                <Button color="inherit" onClick={onSignIn}>
                                    Sign In
                                </Button>
                            )}
                            {page !== 'signup' && (
                                <Button
                                    color="secondary"
                                    variant="contained"
                                    onClick={onSignUp}
                                >
                                    Sign Up
                                </Button>
                            )}
                        </Stack>
                    )}
                    <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    )
}
