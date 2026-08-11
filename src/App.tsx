import { useState, useEffect } from 'react';
import './App.css';

// Formato que a API v2 devolve para cada década
interface DadoDecada {
  periodo: string;
  frequencia: number;
}

function App() {
  const [nomeBusca, setNomeBusca] = useState('');
  const [todosNomes, setTodosNomes] = useState<string[]>([]); // lista para o autocomplete
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [resultado, setResultado] = useState<DadoDecada[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  // 1) Ao carregar a página, busca uma lista de nomes reais pro autocomplete
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/censos/nomes/ranking')
      .then((res) => res.json())
      .then((data) => {
        const nomes = data.map((item: any) => item.nome) ?? [];
        console.log('nomes carregados:', nomes); // <-- linha nova
        setTodosNomes(nomes);
      })
      .catch((err) => {
        console.log('erro ao buscar nomes:', err); // <-- linha nova
        setTodosNomes([]);
      });
  }, []);

  // 2) Toda vez que o texto do input muda, filtra a lista local
  const handleChange = (valor: string) => {
    setNomeBusca(valor);

    if (valor.trim().length === 0) {
      setSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }

    const filtradas = todosNomes.filter((nome) =>
      nome.toLowerCase().startsWith(valor.toLowerCase())
    );
    setSugestoes(filtradas);
    setMostrarSugestoes(filtradas.length > 0);
  };

  // 3) Busca os dados reais do nome na API por décadas
  const buscarDadosNome = async (nome: string) => {
    if (!nome.trim()) return;

    setCarregando(true);
    setErro('');
    setMostrarSugestoes(false);

    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v2/censos/nomes/${nome}`
      );
      const data = await res.json();

      if (!data[0] || !data[0].res) {
        setErro('Nome não encontrado.');
        setResultado([]);
        return;
      }

      setResultado(data[0].res);
    } catch {
      setErro('Erro ao buscar dados. Tente novamente.');
      setResultado([]);
    } finally {
      setCarregando(false);
    }
  };

  const formatarPeriodo = (periodo: string) => {
    const limpo = periodo.replace('[', '').replace(']', '').replace(')', '');
    const partes = limpo.split(',');

    if (partes.length === 2) {
      if (!partes[0]) return `Até ${partes[1]}`;
      return `${partes[0]} a ${partes[1]}`;
    }
    return periodo;
  };

  return (
    <div className="container">
      <div className="card-busca">
        <h1>🔍 Busca de Nomes no Brasil (IBGE)</h1>
        <p className="subtitulo">
          Descubra a frequência do seu nome por décadas!
        </p>

        <div className="busca-box">
          <div className="input-container">
            <input
              type="text"
              value={nomeBusca}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarDadosNome(nomeBusca)}
              onFocus={() => sugestoes.length > 0 && setMostrarSugestoes(true)}
              placeholder="Digite um nome (ex: Maria, Lucas)..."
            />

            {mostrarSugestoes && sugestoes.length > 0 && (
              <ul className="lista-sugestoes">
                {sugestoes.map((nomeItem) => (
                  <li
                    key={nomeItem}
                    onClick={() => {
                      setNomeBusca(nomeItem);
                      setMostrarSugestoes(false);
                      buscarDadosNome(nomeItem);
                    }}
                  >
                    {nomeItem}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={() => buscarDadosNome(nomeBusca)}>Buscar</button>
        </div>

        {carregando && <p>Carregando...</p>}
        {erro && <p className="erro">{erro}</p>}

        {resultado.length > 0 && (
          <ul className="resultado-lista">
            {resultado.map((item) => (
              <li key={item.periodo}>
                <span>{formatarPeriodo(item.periodo)}</span>
                <strong>{item.frequencia.toLocaleString('pt-BR')}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
