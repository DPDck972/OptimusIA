import { useState } from 'react';
import { datasetService } from '../../services/datasetService';
import './DatasetUploadModal.css';

function DatasetUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
        setError('Apenas arquivos .xlsx são aceitos');
        setFile(null);
        return;
      }

      const maxSizeMB = 50;
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        setFile(null);
        return;
      }

      setError('');
      setFile(selectedFile);
      setName(selectedFile.name.replace('.xlsx', ''));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Selecione um arquivo');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await datasetService.uploadDataset(file, name || undefined);
      
      setSuccess(`Dataset "${result.name}" enviado com sucesso! (${result.rows} linhas, ${result.columns} colunas)`);
      setFile(null);
      setName('');

      setTimeout(() => {
        onUploadSuccess?.(result.dataset_id);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Erro ao enviar dataset');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='dataset-modal-overlay'>
      <div className='dataset-modal'>
        <div className='dataset-modal-header'>
          <h2>📤 Adicionar Novo Dataset</h2>
          <button
            className='dataset-modal-close'
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleUpload} className='dataset-form'>
          <div className='dataset-form-group'>
            <label htmlFor='dataset-file'>Arquivo Excel (.xlsx):</label>
            <input
              id='dataset-file'
              type='file'
              accept='.xlsx'
              onChange={handleFileChange}
              disabled={isLoading}
              className='dataset-input'
            />
            {file && (
              <p className='dataset-file-info'>
                ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          <div className='dataset-form-group'>
            <label htmlFor='dataset-name'>Nome do Dataset (opcional):</label>
            <input
              id='dataset-name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Digite um nome descritivo'
              disabled={isLoading}
              className='dataset-input'
            />
          </div>

          {error && <div className='dataset-error-message'>{error}</div>}
          {success && <div className='dataset-success-message'>{success}</div>}

          <div className='dataset-modal-actions'>
            <button
              type='button'
              onClick={onClose}
              disabled={isLoading}
              className='btn-cancel'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={!file || isLoading}
              className='btn-upload'
            >
              {isLoading ? 'Enviando...' : 'Enviar Dataset'}
            </button>
          </div>
        </form>

        <div className='dataset-modal-info'>
          <p>
            <strong>Requisitos:</strong> Arquivo Excel com colunas normalizadas e dados SIAFI
          </p>
        </div>
      </div>
    </div>
  );
}

export default DatasetUploadModal;
