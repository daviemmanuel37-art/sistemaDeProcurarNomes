import { useState } from 'react';
import './App.css';

interface DadosIBGE {
  nome: string;
  res: Array<{
    periodo: string;
    frequencia: number;
  }>;
}

export default function App() {
  const [nome, setNome] = useState('');
  const [resultado, setResultado] = useState<DadosIBGE | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const buscarNome = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      setErro('Por favor, digite um nome para buscar.');
      setResultado(null);
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);

    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v2/censos/nomes/${nome.trim()}`
      );

      if (!response.ok) {
        throw new Error('Falha ao se conectar com a API do IBGE.');
      }

      const data = await response.json();

      if (data.length === 0 || !data[0].res || data[0].res.length === 0) {
        setErro(`Nenhum dado encontrado para o nome "${nome}".`);
      } else {
        setResultado(data[0]);
      }
    } catch {
      setErro('Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const formatarDecada = (periodo: string) => {
    if (periodo.startsWith('1930[')) return 'Até 1930';
    return periodo.replace(/\[/g, '').replace(',', ' a ');
  };

  return (
    <div className="container">
      <h1>🔍 Busca de Nomes no Brasil (IBGE)</h1>
      <p>Descubra a frequência do seu nome por décadas!</p>

      <form onSubmit={buscarNome} className="search-form">
        <input
          type="text"
          placeholder="Digite um nome (ex: Maria, Lucas)..."
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <button type="submit">Buscar</button>
      </form>

      {loading && <div className="spinner">⌛ Buscando dados no IBGE...</div>}

      {erro && <div className="error-message">{erro}</div>}

      {resultado && (
        <div className="results-container">
          <h2>Resultados para: <span>{resultado.nome}</span></h2>
          <div className="cards-grid">
            {resultado.res.map((item, index) => (
              <div key={index} className="card">
                <h3>Década de {formatarDecada(item.periodo)}</h3>
                <p className="frequencia">{item.frequencia.toLocaleString('pt-BR')} pessoas</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}