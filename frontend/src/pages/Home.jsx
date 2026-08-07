import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-hero">
      <div className="home-anello" aria-hidden="true"></div>
      <div className="home-eyebrow">Società Nazionale di Salvamento</div>
      <h1 className="home-titolo">SNS — Portonovo</h1>
      <p className="home-sottotitolo">Gestione turni soccorritori</p>

      <div className="home-azioni">
        <button className="btn-primaria" onClick={() => navigate('/registrati')}>
          Nuovo utente
        </button>
        <button className="btn-secondaria" onClick={() => navigate('/accedi')}>
          Utente già registrato
        </button>
      </div>
    </div>
  );
}
