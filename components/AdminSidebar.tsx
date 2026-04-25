'use client';

import { useState } from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';

export interface SidebarItem {
  label: string;
  icon: string;
  tabIndex: number | null; // null = action item (e.g., Manage Services)
  action?: () => void;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const NAV_ITEMS: SidebarSection[] = [
  {
    title: 'LEADS',
    items: [
      { label: 'All Leads', icon: '📋', tabIndex: 0 },
      { label: 'AI Services', icon: '🤖', tabIndex: 1 },
      { label: 'Payroll', icon: '💰', tabIndex: 2 },
    ],
  },
  {
    title: 'FINANCES',
    items: [
      { label: 'Invoices', icon: '📄', tabIndex: 3 },
      { label: 'Clients', icon: '👥', tabIndex: 4 },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Pipeline', icon: '📊', tabIndex: 5 },
      { label: 'AIIO Tracker', icon: '🤖', tabIndex: 6 },
      { label: 'Analytics', icon: '📈', tabIndex: 7 },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Manage Services', icon: '⚙️', tabIndex: null },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  onManageServices?: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onManageServices }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    LEADS: true,
    FINANCES: true,
    OPERATIONS: true,
    SETTINGS: true,
  });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <Box
      sx={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: 64,
        background: 'rgba(15,23,42,0.95)',
        borderRight: '1px solid rgba(99,102,241,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        transition: 'width 200ms ease',
        zIndex: 10,
      }}
    >
      {/* Collapse toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: collapsed ? 0.5 : 1 }}>
        <IconButton
          size="small"
          onClick={() => setCollapsed(!collapsed)}
          sx={{ color: 'rgba(255,255,255,0.6)' }}
        >
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </IconButton>
      </Box>

      {NAV_ITEMS.map(section => {
        const isExpanded = expandedSections[section.title] ?? true;
        return (
          <Box key={section.title} sx={{ mb: 0.5 }}>
            {/* Section header */}
            <Box
              onClick={() => !collapsed && toggleSection(section.title)}
              sx={{
                px: 1.5,
                py: 0.75,
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
                cursor: collapsed ? 'default' : 'pointer',
                '&:hover': collapsed ? {} : { background: 'rgba(99,102,241,0.08)' },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.45)',
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  fontSize: '0.65rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {collapsed ? section.title.charAt(0) : section.title}
              </Typography>
              {!collapsed && isExpanded && (
                <ExpandLess sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
              )}
              {!collapsed && !isExpanded && (
                <ExpandMore sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
              )}
            </Box>

            {/* Section items */}
            {!collapsed && (
              <Collapse in={isExpanded}>
                {section.items.map(item => {
                  const isActive = item.tabIndex !== null && activeTab === item.tabIndex;
                  return (
                    <Box
                      key={item.label}
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else if (item.tabIndex !== null) {
                          onTabChange(item.tabIndex);
                        } else if (item.label === 'Manage Services' && onManageServices) {
                          onManageServices();
                        }
                      }}
                      sx={{
                        px: 2,
                        py: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        cursor: 'pointer',
                        background: isActive
                          ? 'rgba(99,102,241,0.2)'
                          : 'transparent',
                        borderLeft: isActive
                          ? '3px solid #6366f1'
                          : '3px solid transparent',
                        '&:hover': {
                          background: isActive
                            ? 'rgba(99,102,241,0.2)'
                            : 'rgba(99,102,241,0.15)',
                        },
                        transition: 'all 150ms ease',
                      }}
                    >
                      <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isActive ? '#6366f1' : 'rgba(255,255,255,0.75)',
                          fontWeight: isActive ? 600 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Collapse>
            )}

            {/* Collapsed: show only icons */}
            {collapsed &&
              section.items.map(item => {
                const isActive = item.tabIndex !== null && activeTab === item.tabIndex;
                return (
                  <Box
                    key={item.label}
                    onClick={() => {
                      if (item.tabIndex !== null) {
                        onTabChange(item.tabIndex);
                      } else if (item.label === 'Manage Services' && onManageServices) {
                        onManageServices();
                      }
                    }}
                    sx={{
                      px: 0,
                      py: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: isActive
                        ? 'rgba(99,102,241,0.2)'
                        : 'transparent',
                      borderLeft: isActive
                        ? '3px solid #6366f1'
                        : '3px solid transparent',
                      '&:hover': {
                        background: isActive
                          ? 'rgba(99,102,241,0.2)'
                          : 'rgba(99,102,241,0.15)',
                      },
                      transition: 'all 150ms ease',
                    }}
                    title={item.label}
                  >
                    <Typography sx={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</Typography>
                  </Box>
                );
              })}
          </Box>
        );
      })}
    </Box>
  );
}