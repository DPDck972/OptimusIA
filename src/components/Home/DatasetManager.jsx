import { useState, useEffect } from 'react';
import { datasetService } from '../../services/datasetService';
import './DatasetManager.css';

function DatasetManager({ onDatasetChange, isOpen, onClose }) {
  const [datasets, setDatasets] = useState({});
  const [activeDataset, setActiveDataset] = useState('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDatasets();
    }
  }, [isOpen]);

  const loadDatasets = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await datasetService.listDatasets();
      setDatasets(data.datasets || {});
      setActiveDataset(data.active_dataset || 'default');
    } catch (err) {
      setError(err.message || 'Erro ao carregar datasets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async (datasetId) => {
    if (datasetId === activeDataset) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await datasetService.activateDataset(datasetId);
      setActiveDataset(datasetId);
      setSuccess(`Dataset "${result.name}" ativado com sucesso!`);
      onDatasetChange?.(datasetId);

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Erro ao ativar dataset');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (datasetId) => {
    if (datasetId === 'default') {
      setError('Dataset padrão não pode ser deletado');
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar este dataset?`)) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await datasetService.deleteDataset(datasetId);
      setDatasets((prev) => {
        const updated = { ...prev };
        delete updated[datasetId];
        return updated;
      });
      setSuccess('Dataset deletado com sucesso');

      setTimeout(() => {
        setSuccess('');
        loadDatasets();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erro ao deletar dataset');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='dataset-manager-overlay'>
      <div className='dataset-manager'>
        <div className='dataset-manager-header'>
          <h2>📊 Gerenciar Datasets</h2>
          <button
            className='dataset-manager-close'
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className='dataset-manager-content'>
          {error && <div className='dataset-error-message'>{error}</div>}
          {success && <div className='dataset-success-message'>{success}</div>}

          {isLoading ? (
            <div className='dataset-loading'>Carregando datasets...</div>
          ) : Object.keys(datasets).length === 0 ? (
            <div className='dataset-empty'>Nenhum dataset disponível</div>
          ) : (
            <div className='dataset-list'>
              {Object.entries(datasets).map(([id, info]) => (
                <div
                  key={id}
                  className={`dataset-item ${id === activeDataset ? 'active' : ''}`}
                >
                  <div className='dataset-item-info'>
                    <h3>{info.name}</h3>
                    <p className='dataset-item-meta'>
                      {info.rows} linhas • {info.columns} colunas
                    </p>
                    <p className='dataset-item-date'>
                      Criado: {new Date(info.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className='dataset-item-actions'>
                    {id === activeDataset ? (
                      <span className='dataset-badge-active'>✓ Ativo</span>
                    ) : (
                      <button
                        className='btn-activate'
                        onClick={() => handleActivate(id)}
                        disabled={isLoading}
                      >
                        Ativar
                      </button>
                    )}

                    {id !== 'default' && (
                      <button
                        className='btn-delete'
                        onClick={() => handleDelete(id)}
                        disabled={isLoading}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='dataset-manager-footer'>
          <button
            className='btn-close-manager'
            onClick={onClose}
            disabled={isLoading}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DatasetManager;
