'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ActionIcon, AppShell, Avatar, Box, Burger, Container, Divider, Group, Input, Kbd, Menu, NavLink, ScrollArea,
  Stack, Text, ThemeIcon, Tooltip, UnstyledButton, useComputedColorScheme, useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure, useLocalStorage, useMediaQuery, useOs } from '@mantine/hooks';
import { Spotlight, spotlight, type SpotlightActionGroupData } from '@mantine/spotlight';
import { nprogress } from '@mantine/nprogress';
import {
  IconBus, IconKey, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconLogout, IconMoon, IconSearch,
  IconSelector, IconSun, IconUser,
} from '@tabler/icons-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { api } from '@/lib/api';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import type { NavItem, NavSection } from './nav-items';

interface Props {
  nav: NavSection[];
  /** Whether to show Profile & Change Password links */
  showAccountLinks?: boolean;
  children: React.ReactNode;
}

const HEADER_HEIGHT = 56;
const NAV_WIDTH = 248;
const RAIL_WIDTH = 68;

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + '/');

export function AdminShell({ nav, showAccountLinks = true, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const showPageLoader = useUiStore((s) => s.showPageLoader);
  const hidePageLoader = useUiStore((s) => s.hidePageLoader);
  const { setColorScheme } = useMantineColorScheme();
  const scheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const [mobileOpen, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [railed, setRailed] = useLocalStorage({ key: 'buspoint-nav-rail', defaultValue: false });
  const isPhone = useMediaQuery('(max-width: 48em)');
  // The icon rail only applies on desktop; the phone drawer always shows labels
  const rail = railed && !isPhone;
  const shortcut = useOs() === 'macos' ? '⌘ K' : 'Ctrl K';

  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'School Admin';
  const displayName = user?.fullName || user?.email || 'Account';
  const school = user?.school ?? null;

  function go(href: string) {
    if (href !== pathname) nprogress.start();
    router.push(href);
  }

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

  // ⌘K — every page plus account actions
  const accountItems: NavItem[] = showAccountLinks
    ? [
        { label: 'Profile', href: '/profile', icon: IconUser },
        { label: 'Change password', href: '/change-password', icon: IconKey },
      ]
    : [];
  const spotlightActions: SpotlightActionGroupData[] = [
    ...nav.map((section) => ({
      group: section.label,
      actions: section.items.map((item) => ({
        id: item.href,
        label: item.label,
        leftSection: <item.icon size={18} stroke={1.75} />,
        onClick: () => go(item.href),
      })),
    })),
    {
      group: 'Account',
      actions: [
        ...accountItems.map((item) => ({
          id: item.href,
          label: item.label,
          leftSection: <item.icon size={18} stroke={1.75} />,
          onClick: () => go(item.href),
        })),
        {
          id: 'theme',
          label: scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
          keywords: ['theme', 'dark', 'light', 'appearance'],
          leftSection: scheme === 'dark' ? <IconSun size={18} stroke={1.75} /> : <IconMoon size={18} stroke={1.75} />,
          onClick: () => setColorScheme(scheme === 'dark' ? 'light' : 'dark'),
        },
        { id: 'logout', label: 'Log out', keywords: ['sign out'], leftSection: <IconLogout size={18} stroke={1.75} />, onClick: handleLogout },
      ],
    },
  ];

  function renderItem(item: NavItem) {
    const active = isActive(pathname, item.href);
    if (rail) {
      return (
        <Tooltip key={item.href} label={item.label} position="right">
          <ActionIcon
            component={Link}
            href={item.href}
            size={44}
            radius="md"
            variant={active ? 'filled' : 'subtle'}
            color={active ? undefined : 'gray'}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon size={20} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
      );
    }
    return (
      <NavLink
        key={item.href}
        component={Link}
        href={item.href}
        label={item.label}
        leftSection={<item.icon size={18} stroke={1.75} />}
        active={active}
        onClick={closeMobile}
        variant="light"
        fw={500}
      />
    );
  }

  const userCard = (
    <Menu position={rail ? 'right-end' : 'top-start'} width={240} withinPortal>
      <Menu.Target>
        <UnstyledButton aria-label="Account menu" w={rail ? undefined : '100%'} p={rail ? 0 : 'xs'}>
          <Group gap="sm" wrap="nowrap">
            <Avatar name={displayName} color="initials" variant="filled" radius="xl" size={34} />
            {!rail && (
              <>
                <Box miw={0} flex={1}>
                  <Text size="sm" fw={500} truncate="end">{displayName}</Text>
                  <Text size="xs" c="dimmed">{roleLabel}</Text>
                </Box>
                <IconSelector size={16} stroke={1.5} />
              </>
            )}
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Signed in as</Menu.Label>
        <Text size="sm" px="sm" pb="xs" fw={500} truncate="end">{user?.email}</Text>
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
  );

  return (
    <AppShell
      layout="alt"
      header={{ height: HEADER_HEIGHT }}
      navbar={{ width: rail ? RAIL_WIDTH : NAV_WIDTH, breakpoint: 'sm', collapsed: { mobile: !mobileOpen } }}
      padding={0}
    >
      {/* ── Sidebar ── */}
      <AppShell.Navbar p="sm" data-app-sidebar data-mantine-color-scheme="dark">
        <AppShell.Section h={HEADER_HEIGHT - 12} mb="sm">
          <Group h="100%" gap="sm" wrap="nowrap" justify={rail ? 'center' : 'space-between'} px={rail ? 0 : 'xs'}>
            <Group gap="sm" wrap="nowrap" miw={0}>
              {school ? (
                <Tooltip label={school.name} position="right" disabled={!rail}>
                  <Avatar
                    src={school.logoUrl}
                    name={school.name}
                    color="initials"
                    variant="filled"
                    radius="md"
                    size={34}
                    alt={school.name}
                    styles={{ image: { objectFit: 'contain', background: 'white' } }}
                  />
                </Tooltip>
              ) : (
                <ThemeIcon size={34} radius="md"><IconBus size={18} /></ThemeIcon>
              )}
              {!rail && (
                <Box miw={0}>
                  <Text fw={700} size="sm" lh={1.25} truncate="end" title={school?.name}>
                    {school?.name ?? 'BusPoint'}
                  </Text>
                  <Text size="xs" c="dimmed" lh={1.25} truncate="end">
                    {school ? 'School admin · BusPoint' : roleLabel}
                  </Text>
                </Box>
              )}
            </Group>
            <Burger opened={mobileOpen} onClick={toggleMobile} hiddenFrom="sm" size="sm" aria-label="Close navigation" />
          </Group>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea} mx="-sm" px="sm">
          <Stack gap="lg">
            {nav.map((section) => (
              <Stack key={section.label} gap={2} align={rail ? 'center' : 'stretch'}>
                {rail ? (
                  <Divider w={28} mb={6} />
                ) : (
                  <Text size="xs" fw={600} c="dimmed" px="sm" mb={4}>{section.label}</Text>
                )}
                {section.items.map(renderItem)}
              </Stack>
            ))}
          </Stack>
        </AppShell.Section>

        <AppShell.Section pt="sm">
          <Group justify={rail ? 'center' : 'stretch'}>{userCard}</Group>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* ── Header ── */}
      <AppShell.Header bg="var(--app-chrome)">
        <Group h="100%" px={{ base: 'sm', sm: 'md' }} justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Burger opened={mobileOpen} onClick={toggleMobile} hiddenFrom="sm" size="sm" aria-label="Open navigation" />
            <ThemeIcon hiddenFrom="sm" size={28} radius="md"><IconBus size={16} /></ThemeIcon>
            <Tooltip label={rail ? 'Expand sidebar' : 'Collapse sidebar'}>
              <ActionIcon
                visibleFrom="sm"
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => setRailed((v) => !v)}
                aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {rail ? <IconLayoutSidebarLeftExpand size={20} stroke={1.5} /> : <IconLayoutSidebarLeftCollapse size={20} stroke={1.5} />}
              </ActionIcon>
            </Tooltip>
            <Input
              component="button"
              type="button"
              pointer
              visibleFrom="sm"
              w={300}
              aria-label="Search"
              leftSection={<IconSearch size={16} stroke={1.75} />}
              rightSection={<Kbd size="xs">{shortcut}</Kbd>}
              rightSectionWidth={64}
              onClick={spotlight.open}
            >
              <Input.Placeholder>Search…</Input.Placeholder>
            </Input>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <ActionIcon hiddenFrom="sm" variant="default" size="lg" onClick={spotlight.open} aria-label="Search">
              <IconSearch size={18} stroke={1.75} />
            </ActionIcon>
            <ColorSchemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Content: white cards on a gray page ── */}
      <AppShell.Main bg="var(--app-body)" mih="100dvh">
        <Container size="xl" px={{ base: 'md', md: 'xl' }} py={{ base: 'md', md: 'xl' }}>{children}</Container>
      </AppShell.Main>

      <Spotlight
        actions={spotlightActions}
        nothingFound="Nothing found"
        highlightQuery
        searchProps={{ leftSection: <IconSearch size={18} stroke={1.5} />, placeholder: 'Search pages and actions…' }}
      />
    </AppShell>
  );
}
