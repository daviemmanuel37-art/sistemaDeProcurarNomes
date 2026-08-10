import React, { useState, useEffect } from 'react';
import './App.css';

interface FrequenciaDecada {
  periodo: string;
  frequencia: number;
}

interface ResultadoIBGE {
  nome: string;
  res: FrequenciaDecada[];
}

export function App() {
  const [nomeBusca, setNomeBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [resultado, setResultado] = useState<ResultadoIBGE | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  // Busca sugestões de nomes conforme o usuário digita
  useEffect(() => {
    const termo = nomeBusca.trim();
    if (termo.length < 2) {
      setSugestoes([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v2/censos/nomes/${encodeURIComponent(termo)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            const nomesEncontrados = data.map((item: any) => item.nome);
            setSugestoes(nomesEncontrados);
            setMostrarSugestoes(true);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar sugestões:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nomeBusca]);

  // Busca os dados reais de décadas para o nome
  const buscarDadosNome = async (nomeParaBuscar: string) => {
    const termoFinal = nomeParaBuscar.trim();
    if (!termoFinal) {
      setErro('Por favor, digite um nome para buscar.');
      return;
    }

    setLoading(true);
    setErro('');
    setResultado(null);
    setMostrarSugestoes(false);

    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v2/censos/nomes/${encodeURIComponent(termoFinal)}`
      );

      if (!response.ok) {
        throw new Error('Erro ao conectar com a API do IBGE.');
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setErro(`Nenhum resultado encontrado para o nome "${termoFinal}".`);
      } else {
        setResultado(data[0]);
      }
    } catch (err) {
      setErro('Ocorreu um erro ao buscar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecaoSugestao = (nome: string) => {
    setNomeBusca(nome);
    setMostrarSugestoes(false);
    buscarDadosNome(nome);
  };

  const formatarPeriodo = (periodo: string) => {
    const limpo = periodo.replace('[', '').replace(']', '').replace(']', '');
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
        <p className="subtitulo">Descubra a frequência do seu nome por décadas!</p>

        <div className="busca-box">
          <div className="input-container">
            <input
              type="text"
              value={nomeBusca}
              onChange={(e) => setNomeBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscarDadosNome(nomeBusca)}
              onFocus={() => sugestoes.length > 0 && setMostrarSugestoes(true)}
              placeholder="Digite um nome (ex: Maria, Lucas)..."
            />

            {mostrarSugestoes && sugestoes.length > 0 && (
              <ul className="lista-sugestoes">
                {sugestoes.map((nomeItem) => (
                  <li
                    key={nomeItem}
                    onClick={() => handleSelecaoSugestao(nomeItem)}
                  >
                    {nomeItem}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={() => buscarDadosNome(nomeBusca)}>Buscar</button>
        </div>

        {erro && <p className="mensagem-erro">{erro}</p>}
        {loading && <p className="mensagem-carregando">Carregando dados do IBGE...</p>}

        {resultado && (
          <div className="resultado-container">
            <h2>Resultados para: <span>{resultado.nome}</span></h2>

            <div className="cards-grid">
              {resultado.res.map((item, index) => (
                <div key={index} className="card-decada">
                  <span className="decada-titulo">
                    Década de {formatarPeriodo(item.periodo)}
                  </span>
                  <span className="decada-valor">
                    {item.frequencia.toLocaleString('pt-BR')} pessoas
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;