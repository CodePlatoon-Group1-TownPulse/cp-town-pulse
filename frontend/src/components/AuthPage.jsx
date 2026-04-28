export default function AuthPage({ 
    mode, 
    handleSigninSubmit, 
    handleSignup, 
    formUsername, 
    setFormUsername, 
    formPassword, 
    setFormPassword, 
    formName, 
    setFormName, 
    authError, 
    authSubmitting, 
    googleClientId, 
    googleButtonRef 
}) {
    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h1>
                <p>
                    {mode === 'signin' 
                        ? 'Sign in to see local civic events and save the ones you want.' 
                        : 'Create an account to save events and keep track of city happenings.'}
                </p>

                <form className="auth-form" onSubmit={mode === 'signin' ? handleSigninSubmit : handleSignup}>
                    {mode === 'signup' && (
                        <input
                            type="text"
                            placeholder="Name (optional)"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                        />
                    )}
                    <input
                        type="text"
                        placeholder="Username"
                        autoComplete="username"
                        required
                        value={formUsername}
                        onChange={(e) => setFormUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        required
                        minLength={mode === 'signup' ? 8 : undefined}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                    />
                    {authError && <p className="auth-error">{authError}</p>}
                    <button type="submit" disabled={authSubmitting}>
                        {authSubmitting 
                            ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') 
                            : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                {!googleClientId && (
                    <p className="auth-error">
                        Google sign-in is not configured. Set GOOGLE_CLIENT_ID in the server .env file.
                    </p>
                )}
                <div ref={googleButtonRef} className="google-button-slot" />
            </div>
        </main>
    )
}