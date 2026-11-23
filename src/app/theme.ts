import { Button, Checkbox, FileInput, NavLink, Paper, Select, Textarea, TextInput, createTheme } from '@mantine/core';
import { ChevronDown } from 'lucide-react';
import { createElement } from 'react';

export const torinTheme = createTheme({
  primaryColor: 'teal',
  defaultRadius: 'md',
  respectReducedMotion: true,
  components: {
    Button: Button.extend({ defaultProps: { size: 'md', variant: 'default' } }),
    Checkbox: Checkbox.extend({ defaultProps: { size: 'md' } }),
    FileInput: FileInput.extend({ defaultProps: { size: 'md' } }),
    NavLink: NavLink.extend({ defaultProps: { variant: 'subtle' } }),
    Paper: Paper.extend({ defaultProps: { withBorder: true } }),
    Select: Select.extend({
      defaultProps: {
        size: 'md',
        allowDeselect: false,
        rightSection: createElement(ChevronDown, { size: 16, 'aria-hidden': true }),
        comboboxProps: { transitionProps: { transition: 'pop', duration: 150 } },
      },
    }),
    TextInput: TextInput.extend({ defaultProps: { size: 'md' } }),
    Textarea: Textarea.extend({ defaultProps: { size: 'md', classNames: { input: 'code-input' } } }),
  },
});
