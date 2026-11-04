'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppShell, Avatar, Box, Breadcrumbs, Burger, Container, Divider, Group, Menu, NavLink, ScrollArea, Text, ThemeIcon, UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBus, IconChevronDown, IconKey, IconLogout, IconUser } from '@tabler/icons-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { api } from '@/lib/api';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import type { NavItem } from './nav-items';

interface Props {
  navItems: NavItem[];
  /** Whether to show Profile & Change Password links */
  showAccountLinks?: boolean;
  children: React.ReactNode;
}

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');

export function AdminShell({ navItems, showAccountLinks = true, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showPageLoader = useUiStore((s) => s.showPageLoader);
  const hidePageLoader = useUiStore((s) => s.hidePageLoader);
  const [mobileOpen, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'School Admin';
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';
  const activeItem = navItems.find((item) => isActive(pathname, item.href));

  async function handleLogout() {
    showPageLoader('Signing out…');
    try {
      await api.auth.logout();
    } catch {
      // Clear the local session even if the server call fails
    } finally {
      logout();
      router.replace('/login');
      hidePageLoader();
    }
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !mobileOpen } }}
      padding={{ base: 'md', md: 'xl' }}
    >
      {/* ── Header ── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={mobileOpen} onClick={toggleMobile} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            <Breadcrumbs visibleFrom="sm" separatorMargin={6}>
              <Text size="sm" c="dimmed">{roleLabel}</Text>
              {activeItem && <Text size="sm" fw={500}>{activeItem.label}</Text>}
            </Breadcrumbs>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <ColorSchemeToggle />
            <Menu position="bottom-end" width={240}>
              <Menu.Target>
                <UnstyledButton aria-label="Account menu">
                  <Group gap="xs" wrap="nowrap">
                    <Avatar color="brand" radius="xl" size={32}>{initials}</Avatar>
                    <Box visibleFrom="sm" maw={160}>
                      <Text size="sm" fw={500} truncate>{user?.email}</Text>
                      <Text size="xs" c="dimmed">{roleLabel}</Text>
                    </Box>
                    <IconChevronDown size={14} stroke={1.75} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Signed in as</Menu.Label>
                <Text size="sm" px="sm" pb="xs" truncate fw={500}>{user?.email}</Text>
                {showAccountLinks && (
                  <>
                    <Menu.Divider />
                    <Menu.Item component={Link} href="/profile" leftSection={<IconUser size={16} />}>Profile</Menu.Item>
                    <Menu.Item component={Link} href="/change-password" leftSection={<IconKey size={16} />}>Change password</Menu.Item>
                  </>
                )}
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>Log out</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Sidebar ── */}
      <AppShell.Navbar p="md">
        <AppShell.Section mb="lg">
          <Group gap="sm">
            <ThemeIcon size={36} radius="md"><IconBus size={20} /></ThemeIcon>
            <div>
              <Text fw={700} lh={1.2}>BusPoint</Text>
              <Text size="xs" c="dimmed">{roleLabel} Console</Text>
            </div>
          </Group>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea} mx="-md" px="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs" px="sm">
            Menu
          </Text>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={18} stroke={1.75} />}
              active={isActive(pathname, item.href)}
              onClick={closeMobile}
              variant="light"
              mb={2}
             
            />
          ))}
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="sm" />
          {showAccountLinks && (
            <>
              <NavLink component={Link} href="/profile" label="Profile" leftSection={<IconUser size={18} stroke={1.75} />} active={pathname === '/profile'} onClick={closeMobile} variant="light" />
              <NavLink component={Link} href="/change-password" label="Change password" leftSection={<IconKey size={18} stroke={1.75} />} active={pathname === '/change-password'} onClick={closeMobile} variant="light" />
            </>
          )}
          <NavLink label="Log out" c="red" leftSection={<IconLogout size={18} stroke={1.75} />} onClick={handleLogout} />
        </AppShell.Section>
      </AppShell.Navbar>

      {/* ── Content ── */}
      <AppShell.Main>
        <Container size="xl" px={0}>{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
