import { createContext, useContext, useEffect, useState } from "react";

import { getCurrentUser } from "../api/authApi";
import { dashboardCache } from "../services/dashboardCache";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState(() => dashboardCache.getSession());

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {

            const token = localStorage.getItem("access_token");

            const userInfo = localStorage.getItem("user");

            if (token && userInfo) {
                try {
                    const currentUser = await getCurrentUser(token);

                    if (active) {
                        setSessionId(dashboardCache.resetSession());
                        setUser({
                            ...JSON.parse(userInfo),
                            ...currentUser,
                        });
                    }
                } catch {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("user");
                }

            }

            if (active) {
                setLoading(false);
            }
        };

        restoreSession();

        return () => {
            active = false;
        };
    }, []);

    const login = (token, userData) => {
        setSessionId(dashboardCache.resetSession());

        localStorage.setItem("access_token", token);

        localStorage.setItem(
            "user",
            JSON.stringify(userData)
        );

        setUser(userData);

    };

    const logout = () => {
        setSessionId(dashboardCache.resetSession());

        localStorage.removeItem("access_token");

        localStorage.removeItem("user");

        setUser(null);

    };

    return (

        <AuthContext.Provider
            value={{
                user,
                sessionId,
                login,
                logout,
                loading,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>

    );

};

// Preserve the established context API for existing consumers.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
