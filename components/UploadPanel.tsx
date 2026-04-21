'use client';

import { useState, useRef } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, TextField, Stack } from '@mui/material';
import { CloudUpload, Description, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

interface UploadPanelProps {
  token: string;
}

export default function UploadPanel({ token }: UploadPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 10MB.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('token', token);
    formData.append('file', file);
    formData.append('description', 'Client portal upload');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ type: 'success', text: `✅ ${file.name} uploaded successfully! We'll review it shortly.` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <Box>
      <Typography sx={{ color: '#f0f0f8', fontWeight: 'bold', mb: 1 }}>
        📄 Upload Documents
      </Typography>
      <Typography sx={{ color: '#94a3b8', fontSize: 14, mb: 2 }}>
        Upload tax documents, IDs, or other files. We'll receive them automatically.
      </Typography>

      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        sx={{
          border: `2px dashed ${dragOver ? '#a78bfa' : '#4a5568'}`,
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          bgcolor: dragOver ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
          transition: 'all 0.2s',
          mb: 2,
          '&:hover': !uploading ? {
            borderColor: '#a78bfa',
            bgcolor: 'rgba(167,139,250,0.05)'
          } : {}
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
        />
        
        {uploading ? (
          <Box>
            <CircularProgress size={32} sx={{ color: '#a78bfa', mb: 1 }} />
            <Typography sx={{ color: '#94a3b8' }}>Uploading...</Typography>
          </Box>
        ) : (
          <Box>
            <CloudUpload sx={{ fontSize: 48, color: '#a78bfa', mb: 1 }} />
            <Typography sx={{ color: '#f0f0f8', fontWeight: 'bold', mb: 0.5 }}>
              Drop files here or click to upload
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: 13 }}>
              PDF, JPG, PNG, DOC, XLS up to 10MB
            </Typography>
          </Box>
        )}
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          icon={message.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
          sx={{ 
            bgcolor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            '& .MuiAlert-icon': { color: message.type === 'success' ? '#22c55e' : '#ef4444' }
          }}
        >
          {message.text}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ color: '#64748b', fontSize: 12 }}>
          📋 Accepted:
        </Typography>
        {['W-2', '1099', 'K-1', 'ID', 'Bank statements'].map((item) => (
          <Box key={item} sx={{ 
            bgcolor: 'rgba(139,92,246,0.15)', 
            color: '#a78bfa', 
            px: 1, 
            py: 0.25, 
            borderRadius: 1, 
            fontSize: 11 
          }}>
            {item}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
