'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, Stack,
  Avatar, Card, CardContent, Badge, Drawer, List, ListItem,
  ListItemAvatar, ListItemText, Divider, Chip, CircularProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert
} from '@mui/material';
import {
  Send, Close, Chat, ChatBubble, Person, MarkChatRead, CloudUpload
} from '@mui/icons-material';

interface Message {
  id: string;
  content: string;
  sender: 'client' | 'admin';
  senderName?: string;
  createdAt: string;
  read: boolean;
}

interface ChatPanelProps {
  leadId?: string;
  token?: string;
  isAdmin?: boolean;
  showDocuments?: boolean;
}

export default function ChatPanel({ leadId, token, isAdmin = false, showDocuments = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<{leadId: string; name: string; lastMessage: string; unreadCount: number}[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (leadId || token) {
      fetchMessages();
    }
    if (isAdmin) {
      fetchConversations();
    }
  }, [leadId, token, isAdmin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const query = leadId ? `leadId=${leadId}` : `token=${token}`;
      const res = await fetch(`/api/chat?${query}`);
      const data = await res.json();
      // For clients, messages is empty (not persisted). For admin, get from DB.
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/chat?conversations=true');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const body: any = { content: newMessage };
      if (leadId) body.leadId = leadId;
      if (token) body.token = token;
      if (isAdmin) body.isAdmin = true;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (data.success || data.message) {
        // Add message to UI (now persisted in database)
        if (data.message) {
          setMessages(prev => [...prev, data.message]);
        }
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;
    
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('token', token);
      formData.append('description', docDescription || 'Document upload');

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setUploadSuccess(true);
        setSelectedFile(null);
        setDocDescription('');
        setTimeout(() => {
          setShowUpload(false);
          setUploadSuccess(false);
        }, 2000);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Admin in lead detail view with leadId: Show actual chat messages
  if (isAdmin && leadId) {
    // Show embedded chat for this specific lead
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f0f0f8' }}>
            💬 Chat with Client
          </Typography>
        </Box>
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading ? (
            <Typography sx={{ color: 'rgba(240,240,248,0.7)' }}>Loading messages...</Typography>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ChatBubble sx={{ fontSize: 48, color: 'rgba(240,240,248,0.3)', mb: 1 }} />
              <Typography sx={{ color: 'rgba(240,240,248,0.5)' }}>
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg) => {
                const isFromAdmin = msg.sender === 'admin';
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isFromAdmin ? 'flex-start' : 'flex-end',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '80%',
                        bgcolor: isFromAdmin ? 'rgba(99,102,241,0.3)' : '#6366f1',
                        color: '#f0f0f8',
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '0.75rem' }}>
                        {msg.senderName || (isFromAdmin ? 'ALBS Team' : 'Client')}
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          textAlign: isFromAdmin ? 'left' : 'right',
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a reply..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  color: '#f0f0f8',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(240,240,248,0.7)' },
              }}
            />
            <IconButton 
              color="primary" 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              sx={{ bgcolor: '#6366f1', color: 'white', '&:hover': { bgcolor: '#4f46e5' }, '&:disabled': { bgcolor: 'rgba(99,102,241,0.3)' } }}
            >
              {sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    );
  }

  // Admin: Show floating chat button (for conversation list)
  if (isAdmin) {
    return (
      <>
        <IconButton 
          color="primary" 
          onClick={() => setDrawerOpen(true)}
          sx={{ position: 'fixed', bottom: 20, right: 20, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          <Badge badgeContent={conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)} color="error">
            <Chat />
          </Badge>
        </IconButton>

        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 350, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Client Chats</Typography>
              <IconButton color="inherit" onClick={() => setDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            <List sx={{ flex: 1, overflow: 'auto' }}>
              {conversations.map((conv) => (
                <ListItem 
                  key={conv.leadId} 
                  button 
                  onClick={() => {
                    window.location.href = `/admin?chat=${conv.leadId}`;
                  }}
                  sx={{ borderBottom: '1px solid #eee' }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={conv.name}
                    secondary={conv.lastMessage}
                    primaryTypographyProps={{ fontWeight: conv.unreadCount > 0 ? 'bold' : 'regular' }}
                  />
                  {conv.unreadCount > 0 && (
                    <Chip size="small" label={conv.unreadCount} color="error" />
                  )}
                </ListItem>
              ))}
              {conversations.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">No conversations yet</Typography>
                </Box>
              )}
            </List>
          </Box>
        </Drawer>
      </>
    );
  }

  // Client view: Chat + optional document upload
  return (
    <>
      <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatBubble color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Messages
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Chat messages are sent directly to our support team
          </Typography>
        </CardContent>

        <Divider />

        <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f9f9f9' }}>
          {loading ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ChatBubble sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">
                Send a message to our support team
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((msg) => {
                const isClient = msg.sender === 'client';
                return (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isClient ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '80%',
                        bgcolor: isClient ? 'primary.main' : 'white',
                        color: isClient ? 'white' : 'text.primary',
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {msg.content}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.7,
                          textAlign: isClient ? 'right' : 'left',
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Paper>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        <Divider />

        <Box sx={{ p: 2, bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={3}
            />
            <IconButton 
              color="primary" 
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? <CircularProgress size={20} /> : <Send />}
            </IconButton>
          </Box>
          
          {/* Document Upload Button for Client Portal */}
          {showDocuments && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUpload />}
              onClick={() => setShowUpload(true)}
              sx={{ mt: 1 }}
              fullWidth
            >
              Upload Document
            </Button>
          )}
        </Box>
      </Card>

      {/* Document Upload Dialog */}
      <Dialog open={showUpload} onClose={() => !uploading && setShowUpload(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📄 Upload Document</DialogTitle>
        <DialogContent>
          {uploadSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Document sent to support! We'll review it shortly.
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography color="text.secondary">
                Uploaded documents will be sent securely to our support team via email.
              </Typography>
              
              <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                <input
                  type="file"
                  id="doc-upload"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <label htmlFor="doc-upload" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography>
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </Typography>
                  {selectedFile && (
                    <Typography variant="caption" color="text.secondary">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </Typography>
                  )}
                </label>
              </Box>

              <TextField
                label="Description (optional)"
                fullWidth
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder="What's this document for?"
                size="small"
              />

              {uploadError && (
                <Alert severity="error">{uploadError}</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {!uploadSuccess && (
            <>
              <Button onClick={() => setShowUpload(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? <CircularProgress size={20} /> : 'Send Document'}
              </Button>
            </>
          )}
          {uploadSuccess && (
            <Button variant="contained" onClick={() => setShowUpload(false)}>
              Done
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}