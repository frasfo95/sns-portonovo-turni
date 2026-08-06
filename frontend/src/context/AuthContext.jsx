import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(() => {
    const salvato = localStorage.getItem('sns_utente');
    return salvato ? JSON.parse(salvato) : null;
  });

  function accedi(token, datiUtente) {
    localStorage.setItem('sns_token', token);
    localStorage.setItem('sns_utente', JSON.stringify(datiUtente));
    setUtente(datiUtente);
  }

  function esci() {
    localStorage.removeItem('sns_token');
    localStorage.removeItem('sns_utente');
    setUtente(null);
  }

  return (
    <AuthContext.Provider value={{ utente, accedi, esci }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
