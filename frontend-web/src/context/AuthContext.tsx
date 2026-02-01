import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, type User } from 'firebase/auth';
import axios from 'axios';

interface AuthContextType {
    isAuthenticated: boolean;
    userEmail: string | null;
    userName: string | null;
    userPhoto: string | null;
    userRole: string | null;
    login: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signupWithEmail: (email: string, password: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthProvider mounted, waiting for Firebase auth...");

        // Timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.warn("Auth check timed out, forcing loading to false");
            setLoading(false);
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("Auth state changed:", currentUser ? "User logged in" : "No user");
            setUser(currentUser);

            if (currentUser && currentUser.email) {
                const API_URL = import.meta.env.VITE_API_URL || '/api';

                const syncUserWithBackend = async (retryCount = 0) => {
                    try {
                        console.log(`Syncing user with backend (Attempt ${retryCount + 1})...`);
                        const token = await currentUser.getIdToken();

                        // Sync user with backend
                        const response = await axios.post(`${API_URL}/users`, {
                            email: currentUser.email,
                            name: currentUser.displayName || currentUser.email?.split('@')[0],
                            profilePicture: currentUser.photoURL,
                            emailVerified: currentUser.emailVerified
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        console.log("User synced successfully:", response.data);

                        // Fetch user role from backend
                        const roleResponse = await axios.get(`${API_URL}/users/me?email=${currentUser.email}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        console.log("DEBUG: Fetched User Role:", roleResponse.data.role);

                        // Check if banned
                        if (roleResponse.data.status === 'banned') {
                            console.warn("User is BANNED. Redirecting...");
                            await firebaseSignOut(auth);
                            window.location.href = '/banned'; // Force redirect
                            return;
                        }

                        // FRONTEND FAIL-SAFE: Enforce Admin for specific emails
                        if (currentUser.email === 'bhilareshivtejofficial@gmail.com' ||
                            currentUser.email === 'shivtejbhilare@gmail.com') {
                            console.log("DEBUG: Frontend Force Admin Override");
                            setUserRole('ADMIN');
                        } else {
                            setUserRole(roleResponse.data.role);
                        }

                    } catch (error: any) {
                        console.error(`Error syncing user (Attempt ${retryCount + 1}):`, error);

                        // Handle Banned User Error (403 Forbidden)
                        if (error.response && error.response.status === 403 && error.response.data === "User is banned") {
                            console.warn("User is BANNED (403). Redirecting...");
                            await firebaseSignOut(auth);
                            window.location.href = '/banned';
                            return;
                        }

                        // Retry logic for network errors or server startup
                        if (retryCount < 3) {
                            console.log(`Retrying sync in ${2 * (retryCount + 1)} seconds...`);
                            setTimeout(() => syncUserWithBackend(retryCount + 1), 2000 * (retryCount + 1));
                        } else {
                            // Fallback: still check if it's the admin email even if API failed
                            if (currentUser.email === 'bhilareshivtejofficial@gmail.com' ||
                                currentUser.email === 'shivtejbhilare@gmail.com') {
                                console.log("DEBUG: Frontend Force Admin Override (Recovery)");
                                setUserRole('ADMIN');
                            } else {
                                setUserRole('USER');
                            }
                        }
                    }
                };

                // Trigger the sync
                syncUserWithBackend();

            } else {
                console.log("DEBUG: No current user, setting role to null");
                setUserRole(null);
            }

            setLoading(false);
            clearTimeout(timeoutId);
        });
        return () => {
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing in with Email", error);
            throw error;
        }
    };

    const signupWithEmail = async (email: string, password: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Error signing up with Email", error);
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            // @ts-ignore
            await import('firebase/auth').then(module => module.sendPasswordResetEmail(auth, email));
        } catch (error) {
            console.error("Error sending password reset email", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f8f9fa',
                color: '#333',
                fontFamily: 'sans-serif'
            }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
                    Loading Discoursify...
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    (If this takes too long, Firebase might be blocked)
                </div>
                <button
                    onClick={() => {
                        console.log("Skipping auth...");
                        setUser({
                            uid: 'dev-user',
                            email: 'dev@example.com',
                            displayName: 'Dev User',
                            emailVerified: true,
                            isAnonymous: false,
                            metadata: {},
                            providerData: [],
                            providerId: 'firebase',
                            refreshToken: '',
                            tenantId: null,
                            delete: async () => { },
                            getIdToken: async () => '',
                            getIdTokenResult: async () => ({} as any),
                            reload: async () => { },
                            toJSON: () => ({}),
                            phoneNumber: null,
                            photoURL: null
                        } as User);
                        setUserRole('ADMIN');
                        setLoading(false);
                    }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Skip Auth (Dev Mode)
                </button>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!user,
            userEmail: user?.email || null,
            userName: user?.displayName || null,
            userPhoto: user?.photoURL || null,
            userRole,
            login,
            loginWithEmail,
            signupWithEmail,
            resetPassword,
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
