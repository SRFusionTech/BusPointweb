'use client';

import { useState, type ReactNode } from 'react';
import { Combobox, Group, InputBase, Loader, Text, useCombobox } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export interface CreatableOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

const CREATE = '$create';

interface Props {
  data: CreatableOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Called with the trimmed search text ('' when nothing was typed). */
  onCreate: (name: string) => void | Promise<void>;
  /** e.g. "route" → "Create route “X”" / "Create new route" */
  entity: string;
  /** When true the create option needs typed text (entities that only have a name). */
  requireName?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  error?: ReactNode;
}

/** Searchable select whose dropdown always ends with a "+ Create …" option. */
export function CreatableSelect({
  data, value, onChange, onCreate, entity, requireName, label, description,
  placeholder, clearable, disabled, error,
}: Props) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const selected = data.find((o) => o.value === value) ?? null;
  const open = combobox.dropdownOpened;
  const query = search.trim();
  const filtered = query
    ? data.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : data;
  const exactMatch = data.some((o) => o.label.toLowerCase() === query.toLowerCase());
  const createDisabled = (requireName && !query) || exactMatch;
  const createLabel = query && !exactMatch ? `Create ${entity} “${query}”` : `Create new ${entity}`;

  async function handleSubmit(val: string) {
    combobox.closeDropdown();
    if (val !== CREATE) {
      onChange(val);
      return;
    }
    setCreating(true);
    try {
      await onCreate(query);
    } finally {
      setCreating(false);
    }
  }

  const rightSection = creating
    ? <Loader size={14} />
    : clearable && value && !disabled
      ? <Combobox.ClearButton onClear={() => onChange(null)} />
      : <Combobox.Chevron />;

  return (
    <Combobox store={combobox} withinPortal onOptionSubmit={handleSubmit}>
      <Combobox.Target>
        <InputBase
          label={label}
          description={description}
          error={error}
          disabled={disabled || creating}
          placeholder={placeholder}
          value={open ? search : (selected?.label ?? '')}
          rightSection={rightSection}
          rightSectionPointerEvents={clearable && value ? 'all' : 'none'}
          onClick={() => combobox.openDropdown()}
          onFocus={() => { setSearch(''); combobox.openDropdown(); }}
          onBlur={() => combobox.closeDropdown()}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
          }}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={260} style={{ overflowY: 'auto' }}>
          {filtered.map((o) => (
            <Combobox.Option key={o.value} value={o.value} disabled={o.disabled} active={o.value === value}>
              <Text size="sm" fw={o.value === value ? 600 : 400}>{o.label}</Text>
              {o.description && <Text size="xs" c="dimmed">{o.description}</Text>}
            </Combobox.Option>
          ))}
          {data.length > 0 && filtered.length === 0 && (
            <Text size="xs" c="dimmed" px="sm" py={6}>No {entity}s match “{query}”</Text>
          )}
          {data.length === 0 && (
            <Text size="xs" c="dimmed" px="sm" py={6}>No {entity}s yet.</Text>
          )}
          <Combobox.Option
            value={CREATE}
            disabled={createDisabled}
            style={{ borderTop: '1px solid var(--mantine-color-default-border)', marginTop: 4, paddingTop: 8 }}
          >
            <Group gap={8} wrap="nowrap">
              <IconPlus size={14} color={createDisabled ? undefined : 'var(--mantine-primary-color-filled)'} />
              <Text size="sm" fw={500} c={createDisabled ? 'dimmed' : 'var(--mantine-primary-color-filled)'} truncate="end">
                {requireName && !query ? `Type a name to create a ${entity}` : createLabel}
              </Text>
            </Group>
          </Combobox.Option>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
