import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [role, setRoleState] = useState(localStorage.getItem('demo_role') || null);
    const [base, setBaseState] = useState(localStorage.getItem('demo_base') || null);

    const login = (newRole, newBase) => {
        const finalBase = newRole === 'Commander' ? newBase : 'HQ';
        localStorage.setItem('demo_role', newRole);
        localStorage.setItem('demo_base', finalBase);
        localStorage.setItem('token', `demo-${newRole}-${finalBase}`);
        setRoleState(newRole);
        setBaseState(finalBase);
    };

    const logout = () => {
        localStorage.clear();
        setRoleState(null);
        setBaseState(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ role, base, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
