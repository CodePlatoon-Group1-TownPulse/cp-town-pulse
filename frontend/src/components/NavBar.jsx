function NavBar({ isLoggedIn, page, onSignUp, onSignIn, onHome, onSaved, onSignOut }) {
    return (
        <nav className="nav">
            <div className="nav-right">
                {!isLoggedIn && page === 'signin' && (
                    <button className="nav-button" onClick={onSignUp}>
                        Sign Up
                    </button>
                )}

                {!isLoggedIn && page === 'signup' && (
                    <button className="nav-button" onClick={onSignIn}>
                        Sign In
                    </button>
                )}

                {isLoggedIn && (
                    <>
                        <button className="nav-button" onClick={onHome}>
                            Home
                        </button>
                        <button className="nav-button" onClick={onSaved}>
                            Saved
                        </button>
                        <button className="nav-button signout-button" onClick={onSignOut}>
                            Sign Out
                        </button>
                    </>
                )}
            </div>
        </nav>
    )
}

export default NavBar