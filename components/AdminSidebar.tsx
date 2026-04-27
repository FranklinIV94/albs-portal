'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Collapse, IconButton, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, ExpandLess, ExpandMore, Menu as MenuIcon } from '@mui/icons-material';

export interface SidebarItem {
  label: string;
  icon: string;
  tabIndex: number | null;
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
      { label: 'Marketing Plans', icon: '📣', tabIndex: null },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  onManageServices?: () => void;
  onMarketingPlans?: () => void;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

function SidebarContent({ activeTab, onTabChange, onManageServices, onMarketingPlans, collapsed, onToggleCollapse }: {
  activeTab: number;
  onTabChange: (tabIndex: number) => void;
  onManageServices?: () => void;
  onMarketingPlans?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
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
        height: '100%',
        background: 'rgba(15,23,42,0.95)',
        borderRight: '1px solid rgba(99,102,241,0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        transition: 'width 200ms ease',
      }}
    >
      {/* Collapse toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: collapsed ? 0.5 : 1 }}>
        <IconButton
          size="small"
          onClick={onToggleCollapse}
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
                        } else if (item.label === 'Marketing Plans' && onMarketingPlans) {
                          onMarketingPlans();
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

export default function AdminSidebar({ activeTab, onTabChange, onManageServices, mobileOpen = false, onMobileToggle }: AdminSidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const [collapsed, setCollapsed] = useState(false);

  // Auto-collapse on medium screens
  useEffect(() => {
    if (isMobile) {
      setCollapsed(false); // drawer handles it
    }
  }, [isMobile]);

  const handleTabChange = (tabIndex: number) => {
    onTabChange(tabIndex);
    // Close mobile drawer on navigation
    if (isMobile && onMobileToggle) {
      onMobileToggle();
    }
  };

  const handleManageServices = () => {
    if (onManageServices) onManageServices();
    if (isMobile && onMobileToggle) {
      onMobileToggle();
    }
  };

  const handleMarketingPlans = () => {
    if (onMarketingPlans) onMarketingPlans();
    if (isMobile && onMobileToggle) {
      onMobileToggle();
    }
  };

  // Mobile: Drawer overlay
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 240,
            background: 'rgba(15,23,42,0.98)',
            borderRight: '1px solid rgba(99,102,241,0.2)',
          },
        }}
      >
        <SidebarContent
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onManageServices={handleManageServices}
          onMarketingPlans={handleMarketingPlans}
          collapsed={false}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </Drawer>
    );
  }

  // Desktop: persistent sidebar
  return (
    <SidebarContent
      activeTab={activeTab}
      onTabChange={onTabChange}
      onManageServices={onManageServices}
      onMarketingPlans={onMarketingPlans}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed(!collapsed)}
    />
  );
}