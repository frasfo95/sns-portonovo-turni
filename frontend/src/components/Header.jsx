import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ sottotitolo }) {
  const { utente, esci } = useAuth();
  const navigate = useNavigate();
  const [mostraAllerta, setMostraAllerta] = useState(false);

  function handleEsci() {
    esci();
    navigate('/');
  }

  const linkAllerta = import.meta.env.VITE_APP_ALLERTA_URL;

  return (
    <>
      <header className="app-header">
        <div className="app-header-row">
          <h1 className="app-titolo">
            SNS · Portonovo
            <small>{sottotitolo || 'GESTIONE TURNI SOCCORRITORI'}</small>
          </h1>
          {utente && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setMostraAllerta(true)}
                aria-label="Allerta equipaggio"
                title="Allerta equipaggio"
                style={{ background: 'transparent', padding: '2px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>🚨</span>
                <span style={{ fontFamily: 'var(--font-orario)', fontSize: 8.5, color: '#9FC1D6', fontWeight: 600, letterSpacing: '0.02em' }}>
                  App allerta<br />equipaggio
                </span>
              </button>
              <button
                onClick={handleEsci}
                style={{ background: 'transparent', color: '#C9DCE8', fontSize: 12.5, padding: '6px 4px', fontWeight: 500 }}
              >
                Esci
              </button>
            </div>
          )}
        </div>
      </header>

      {mostraAllerta && (
        <div className="overlay overlay-centrato" onClick={() => setMostraAllerta(false)}>
          <div className="modale" onClick={(e) => e.stopPropagation()}>
            <h2>🚨 Allerta equipaggio</h2>
            <p className="sotto">Stai per uscire da questa app per aprire quella di allerta equipaggio.</p>

            <div className="banner-info">
              <div className="banner-titolo">Installa il link sulla Home</div>
              Per ricevere gli allarmi anche ad app chiusa, la prima volta installa quella app sulla schermata
              Home del telefono: dal browser tocca "Condividi" (iPhone) o il menu ⋮ (Android), poi
              "Aggiungi a schermata Home".
            </div>

            <div className="banner-attenzione">
              <div className="banner-titolo">Attiva le notifiche</div>
              Assicurati di aver dato il permesso per le notifiche a quell'app: altrimenti rischi di non
              ricevere un allarme in tempo.
            </div>

            <div className="banner-info">
              <div className="banner-titolo">Registrati di nuovo</div>
              Alla prima apertura dovrai registrarti anche lì: usa lo <b>stesso nome e lo stesso PIN</b> che usi
              in questa app, per riconoscerti più facilmente in entrambe.
            </div>

            <div className="modale-azioni">
              <button className="btn-secondaria" onClick={() => setMostraAllerta(false)}>Annulla</button>
              {linkAllerta ? (
                <a
                  className="btn-primaria"
                  href={linkAllerta}
                  style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Apri l'app di allerta
                </a>
              ) : (
                <button className="btn-primaria" disabled>Link non ancora configurato</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
