import Link from 'next/link';
import { Anchor, Box, Breadcrumbs, Group, Text, Title } from '@mantine/core';

interface Crumb { label: React.ReactNode; href?: string }

interface Props {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  /** Buttons rendered on the right */
  actions?: React.ReactNode;
  /** Rendered left of the title, e.g. an avatar */
  leading?: React.ReactNode;
}

/** Standard top-of-page block for every console screen. */
export function PageHeader({ title, description, breadcrumbs, actions, leading }: Props) {
  return (
    <Box mb="xl">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs mb="xs" separatorMargin={6}>
          {breadcrumbs.map((c, i) =>
            c.href ? (
              <Anchor key={i} component={Link} href={c.href} c="dimmed" size="xs">{c.label}</Anchor>
            ) : (
              <Text key={i} size="xs" c="dimmed">{c.label}</Text>
            ),
          )}
        </Breadcrumbs>
      )}
      <Group justify="space-between" align="flex-end" gap="md">
        <Group gap="md" wrap="nowrap" miw={0}>
          {leading}
          <Box miw={0}>
            {typeof title === 'string' ? <Title order={2} fw={600}>{title}</Title> : title}
            {description && <Text component="div" c="dimmed" size="sm" mt={4} lineClamp={2}>{description}</Text>}
          </Box>
        </Group>
        {actions && <Group gap="sm">{actions}</Group>}
      </Group>
    </Box>
  );
}
